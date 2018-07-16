package gw.job.audit

uses gw.api.productmodel.SeriesAuditSchedulePattern
uses gw.api.productmodel.AuditSchedulePattern
uses java.util.Date
uses java.util.ArrayList
uses gw.plugin.messaging.BillingMessageTransport
uses gw.plugin.Plugins
uses gw.plugin.job.IAuditSchedulePatternSelectorPlugin
uses java.util.HashSet
uses java.util.Set
uses gw.plugin.policyperiod.IPolicyPeriodPlugin
uses gw.api.productmodel.AuditSchedulePatternLookup
uses gw.api.productmodel.SingleCheckingAuditSchedulePatternLookup
uses gw.api.productmodel.SeriesAuditSchedulePatternLookup

@Export
class AuditScheduler {
  construct() {
  }

  /**
   * Schedule a final audit plus all series audits that are specified for this policy period.
   */
  static function scheduleAllAudits(period : PolicyPeriod) {
    if (period.AuditInformations.Count > 0) {
      throw "Policy period should have no audits scheduled when \"scheduleAllAudits()\" is called"
    }
    scheduleFinalAudit(period, false)
    scheduleSeriesCheckingAudits(period)
    scheduleSingleCheckingAudit(period)
    schedulePremiumReports(period)
  }

  /**
   * Schedule a final audit for the given period, taking into account whether it is a cancellation
   * audit or not.
   */
  static function scheduleFinalAudit(period : PolicyPeriod, isCancellation : boolean) {
    if (period.FinalAuditOption != "No") {
      var pattern = selectFinalAuditSchedulePattern(period, isCancellation)
      if (pattern != null) {
        var baseInitDate = period.EndOfCoverageDate
        pattern.createAuditInformation(period,
                                       period.PeriodStart,
                                       period.EndOfCoverageDate,
                                       baseInitDate,
                                       AuditScheduleType.TC_FINALAUDIT,
                                       false)
        period.addEvent(BillingMessageTransport.NEWFINALAUDIT_MSG)
      }
    }
  }

  /**
   * Schedule all series checking audits specified for this policy period.
   */
  static function scheduleSeriesCheckingAudits(period : PolicyPeriod) {
    scheduleAuditSeries(period, period.SeriesCheckingPatternCode, AuditScheduleType.TC_CHECKINGAUDIT)
  }

  /**
   * Schedule a single checking audit for this policy period, provided it is designated on the policy period.
   */
  static function scheduleSingleCheckingAudit(period : PolicyPeriod) {
    var pattern = SingleCheckingAuditSchedulePatternLookup.selectByCode(period.SingleCheckingPatternCode)
    if (pattern != null) {
      var startDate = period.PeriodStart
      var endDate = pattern.EndDateDelayUnit == "BusinessDays"
                    ? startDate.addBusinessDays(pattern.EndDateDelayAmount)
                    : startDate.addDays(pattern.EndDateDelayAmount)
      pattern.createAuditInformation(period, startDate, endDate, endDate, AuditScheduleType.TC_CHECKINGAUDIT, false)
    }
  }

  /**
   * Schedule all premium reports specified for this policy period.
   */
  static function schedulePremiumReports(period : PolicyPeriod) {
    scheduleAuditSeries(period, period.SelectedPaymentPlan.ReportingPatternCode, AuditScheduleType.TC_PREMIUMREPORT)
  }

  /**
   * Schedule a new audit of the specified type for the given period, using the specified start and end
   * date and the specified audit method.  Note that this function uses the end date as the basis for determining
   * when to start the audit job.
   */
  static function scheduleNewAudit(period : PolicyPeriod,
                                   startDate : Date,
                                   endDate : Date,
                                   type : AuditScheduleType,
                                   method : AuditMethod,
                                   isSeries : boolean) {
    scheduleNewAudit(period, startDate, endDate, endDate, endDate.addDays(30), type, method, isSeries)
  }

  /**
   * Schedule a new audit of the specified type for the given period, using the specified start and end
   * date and the specified audit method, and the specified init and due dates.  This function throws
   * exceptions in various situations that can only occur during programmatic audit scheduling; if
   * scheduling is invoked via the OOTB web interface, none of these exception will occur.
   */
  static function scheduleNewAudit(period : PolicyPeriod,
                                   startDate : Date,
                                   endDate : Date,
                                   initDate : Date,
                                   dueDate : Date,
                                   type : AuditScheduleType,
                                   method : AuditMethod,
                                   isSeries : boolean) {
    var available = period.auditTypesAvailableToAdd()
    if (available.Empty or not available.contains(type)) {
      throw (displaykey.Web.Policy.PolicyPeriod.Validation.AuditCreation.NoMoreAudits(type))
    }
    if (method == null) {
      throw (displaykey.Web.Policy.PolicyPeriod.Validation.AuditCreation.MissingMethod)
    }
    if (datesOutOfRange(period, startDate, endDate)) {
      throw (displaykey.Web.Policy.PolicyPeriod.Validation.AuditCreation.DatesOutOfRange)
    }
    if ((type == "PremiumReport") and datesOverlapReport(period, startDate, endDate)) {
      throw (displaykey.Web.Policy.PolicyPeriod.Validation.AuditCreation.OverlappingDates)
    }
    AuditSchedulePatternLookup.getAll().first().createAuditInformation(period, startDate, endDate, initDate, dueDate, type, method, isSeries)
    if(type == AuditScheduleType.TC_FINALAUDIT) {
      period.addEvent(BillingMessageTransport.NEWFINALAUDIT_MSG)
    }
  }

  /**
   * When a cancellation occurs, a scheduled final audit needs to be adjusted so that its end-date
   * coincides with the cancellation date for the policy period.  This method ensures that both the
   * audit end date and the audit due date are properly updated following cancellation.
   */
  static function updateEndDatesFollowingCancellation(period : PolicyPeriod, info : AuditInformation) {
    var pattern = selectFinalAuditSchedulePattern(period, true)
    info.updateEndDatesFollowingCancellation(period, pattern)
  }

  /**
   * In a number of cases (policy change, issuance, cancellation, or reinstatement), existing series audits
   * (most commonly premium reports) need to be withdrawn, removed, or rescheduled.  This function handles
   * the rescheduling of all series-type audits.
   */
  static function rescheduleAuditSeries(period : PolicyPeriod) {
    rescheduleAuditSeries(period, period.SelectedPaymentPlan.ReportingPatternCode, AuditScheduleType.TC_PREMIUMREPORT)
    rescheduleAuditSeries(period, period.SeriesCheckingPatternCode, AuditScheduleType.TC_CHECKINGAUDIT)
  }

  //
  // PRIVATE SUPPORT METHODS
  //
  /**
   * Return the appropriate audit schedule pattern for the given period, whether for cancellation or not.
   */
  private static function selectFinalAuditSchedulePattern(period : PolicyPeriod, isCancellation : boolean) : AuditSchedulePattern {
    var plugin = Plugins.get(IAuditSchedulePatternSelectorPlugin)
    return (isCancellation
            ? plugin.selectFinalAuditSchedulePatternForCancellation(period)
            : plugin.selectFinalAuditSchedulePatternForExpiredPolicy(period))
  }

  /**
   * Create the audit schedule for the series audit specified by the patternName and the scheduleType.
   */
  private static function scheduleAuditSeries(period : PolicyPeriod, patternName : String, scheduleType : AuditScheduleType) {
    var pattern = SeriesAuditSchedulePatternLookup.selectByCode(patternName)
    if (pattern != null) {
      var policyPeriodPlugin = Plugins.get(IPolicyPeriodPlugin)
      createAuditInformations(period, policyPeriodPlugin.computeAuditDates(period, pattern), pattern, scheduleType, null)
    }
  }

  /**
   * Remove any pre-existing audit informations that can be safely deleted.  Then create a new set of audit informations for
   * the period, based on the given patternName and scheduleType.
   */
  private static function rescheduleAuditSeries(period : PolicyPeriod, patternName : String, scheduleType : AuditScheduleType) {
    var pattern = SeriesAuditSchedulePatternLookup.selectByCode(patternName)
    if (pattern != null) {
      var policyPeriodPlugin = Plugins.get(IPolicyPeriodPlugin)
      var dates = policyPeriodPlugin.computeAuditDates(period, pattern)
      var selector : block(ai : AuditInformation) : boolean =
          scheduleType == "PremiumReport"
          ? \ai -> ai.IsPremiumReport and ai.Series
          : \ai -> ai.IsCheckingAudit and ai.Series
      removeUnneededSeriesInfosAndDates(period, dates, pattern, selector)
      createAuditInformations(period, dates, pattern, scheduleType, selector)
    }
  }

  /**
   * Create new audit informations for the given period, based on the given set of dates.
   */
  private static function createAuditInformations(period : PolicyPeriod,
                                                  dates : List<Date>, pattern : SeriesAuditSchedulePattern,
                                                  scheduleType : AuditScheduleType,
                                                  selector : block(ai : AuditInformation) : boolean) {
    if (dates.Count > 0) {
      for (i in 0..|(dates.Count - 1)) {
        pattern.createAuditInformation(period, dates[i], dates[i+1], dates[i+1], scheduleType, true)
      }
    }
    if (selector != null and (period.Job typeis Reinstatement)) {
      // we modify the dates list, so we should copy it.   We might as well optimize
      // for the operations that are being done, so create a set instead.
      var existingDates = dates.toSet()
      period.AuditInformations.where(\ a -> selector(a) and (a.IsWaived or a.IsWithdrawn)).each(\ a -> {
        var start = a.AuditPeriodStartDate
        if (not existingDates.contains(start)) {
          var end = a.AuditPeriodEndDate
          pattern.createAuditInformation(period, start, end, end, scheduleType, true)
          // Prevent duplicate if there are multiple withdrawn or waived audits for a given date
          existingDates.add(start)
        }
      })
    }
  }

  /**
   * Proceed simultaneously through the list of dates and the corresponding audit infos.  Remove dates from
   * the beginning of the list that are not needed, and remove infos from the end of the list that are not needed.
   * On completion, the remaining dates represent start-end date pairs that will be used to schedule new
   * series audits.
   */
  private static function removeUnneededSeriesInfosAndDates(period : PolicyPeriod, dates : List<Date>,
                                                            pattern : SeriesAuditSchedulePattern,
                                                            selector : block(ai : AuditInformation) : boolean) {
    var endOfCoverageDate = period.EndOfCoverageDate
    var seriesInfos = currentlyValidSeriesInfos(period, endOfCoverageDate, selector)
    var lastReportIdx = indexOfLastCompletedAudit(seriesInfos)
    removeUnneededDates(dates, (lastReportIdx == -1 ? period.PeriodStart : seriesInfos[lastReportIdx].AuditPeriodEndDate))
    pruneInfosAndDates(seriesInfos, dates, lastReportIdx)
    ensureMinimumStartAndEndPeriodLengths(dates, pattern)
  }

  /**
   * Do a pair-wise check of dates against the start date and end date on each info.  As soon as an info
   * is found that doesn't match the current pair of dates, dispose of that info and all others after it
   * and remove all dates before the mismatch.  This will leave us with dates that actually correspond to
   * start/end dates for series audits that need to be scheduled.
   */
  private static function pruneInfosAndDates(infos : AuditInformation[], dates : List<Date>, lastReportIdx : int) {

    var disposableInfos = tail(infos, lastReportIdx + 1)
    var invalidInfos = new HashSet<AuditInformation>(disposableInfos.toList())
    var infosByDate = disposableInfos.partition(\ a -> a.AuditPeriodStartDate)
    var idx = 0
    while (idx < dates.Count - 1) {
      var possibleInfos = infosByDate.get(dates[idx])
      if (possibleInfos == null) {
        break
      }
      var possibleMatches = possibleInfos.where(\ a -> a.AuditPeriodEndDate == dates[idx + 1])
      if (possibleMatches.Empty) {
        break
      }
      else {
        invalidInfos.removeAll(possibleMatches)
      }
      idx++
    }
    processDisposableInfos(invalidInfos)
    if (not dates.isEmpty()) {
      removeUnneededDates(dates, dates[idx])
    }
  }

  /**
   * Make sure that the first and last audit periods (i.e. the number of days between neighboring dates) is no less
   * than the user-specified minimum period length.
   */
  private static function ensureMinimumStartAndEndPeriodLengths(dates : List<Date>, pattern : SeriesAuditSchedulePattern) {
    if (dates.Count > 2 and dates[0].daysBetween(dates[1]) < pattern.MinimumAuditPeriodLength) {
      dates.remove(dates[1])
    }
    var last = dates.Count - 1
    var secondLast = dates.Count - 2
    if (dates.Count > 2 and dates[secondLast].daysBetween(dates[last]) < pattern.MinimumAuditPeriodLength) {
      dates.remove(dates[secondLast])
    }
  }

  /**
   * For each audit info that is considered eligible for disposal, if the audit has been started, then
   * withdraw it; otherwise, simply mark the audit info for deletion.
   */
  private static function processDisposableInfos(infos : Set<AuditInformation>) {
    for (info in infos) {
      if (info.HasBeenStarted) {
        if (not (info.IsWithdrawn or info.IsWaived))
          info.Audit.withdraw()
      }
      else {
        info.remove()
      }
    }
  }

  /**
   * Remove any scheduled (i.e. not started) premium report infos that are beyond the endOfCoverageDate.  Return all
   * remaining infos.
   */
  private static function currentlyValidSeriesInfos(period : PolicyPeriod, endOfCoverageDate : Date,
                                                    selector : block(ai : AuditInformation) : boolean) : AuditInformation[] {
    var infos = sortedInfos(period, selector)
    var idx = indexOfLastStartedAudit(infos) + 1

    while (idx < infos.Count) {
      if (infos[idx].AuditPeriodStartDate > endOfCoverageDate and infos[idx].IsScheduled) {
        infos[idx].remove()
      }
      idx++
    }
    return sortedInfos(period, selector)
  }

   /**
   * Return the array of infos, sorted by start date.
   */
  private static function sortedInfos(period : PolicyPeriod, selector : block(ai : AuditInformation) : boolean) : AuditInformation[] {
    return period.AuditInformations
          .where(selector)
          .sortBy(\ info -> info.AuditPeriodStartDate)
  }

  /**
   * Return a sublist of the original list, from the start position to the end of the list.
   */
  private static function tail(list : AuditInformation[], start : int) : AuditInformation[] {
    var newList = new ArrayList<AuditInformation>()
    if (start > -1) {
      var i = start
      while (i < list.Count) {
        newList.add(list[i])
        i++
      }
    }
    return newList.toTypedArray()
  }

  /**
   * Remove dates from the beginning of the list that are less than the firstNeededDate.
   */
  private static function removeUnneededDates(dates : List<Date>, firstNeededDate : Date) {
    var it = dates.iterator()
    while (it.hasNext()) {
      var date = it.next()
      if (date < firstNeededDate) {
        it.remove()
      }
    }
  }

  /**
   * Find and return the index of the latest audit that has been started (could also be completed).
   * Return -1 if there are no such audits.
   */
  private static function indexOfLastStartedAudit(infos : AuditInformation[]) : int {
    return indexOfLastMatchingAudit(infos, \ai -> ai.HasBeenStarted)
  }

  /**
   * Find and return the index of the latest audit that has been completed.
   * Return -1 if there are no such audits.
   */
  private static function indexOfLastCompletedAudit(infos : AuditInformation[]) : int {
    return indexOfLastMatchingAudit(infos, \ai -> ai.IsComplete)
  }

  /**
   * Find and return the index of the latest audit that matches the condition specified by
   * matcher. Return -1 if there are no such audits.
   */
  private static function indexOfLastMatchingAudit(infos : AuditInformation[], matcher : block(ai : AuditInformation) : boolean) : int{
    var end = infos.Count - 1
    for (i in 0..|infos.Count) {
      if (matcher(infos[end - i])) {
        return end - i
      }
    }
    return -1
  }

  /**
   * Return true if either the startDate or the endDate falls outside the effective date range for the period
   */
  private static function datesOutOfRange(period : PolicyPeriod, startDate : Date, endDate : Date) : boolean {
    return (startDate < period.PeriodStart or startDate > period.EndOfCoverageDate
        or endDate < period.PeriodStart or endDate > period.EndOfCoverageDate)
  }

  /**
   * Return true if either the startDate or endDate fall between the start and end date of ANY premium report
   * false otherwise.
   */
  private static function datesOverlapReport(period : PolicyPeriod, startDate : Date, endDate : Date) : boolean {
    var activeReports = period.ActivePremiumReports
    for (i in 0..|activeReports.Count) {
      if (overlaps(activeReports[i], startDate, endDate)) {
        return true
      }
    }
    return false
  }

  /**
   * Return true if either the startDate or endDate fall between the start and end date of the given
   * premium report; false otherwise.
   */
  private static function overlaps(premiumReport : AuditInformation, startDate : Date, endDate : Date) : boolean {
    return ((startDate >= premiumReport.AuditPeriodStartDate and startDate < premiumReport.AuditPeriodEndDate)
             or
            (endDate > premiumReport.AuditPeriodStartDate and endDate <= premiumReport.AuditPeriodEndDate))
  }
}
