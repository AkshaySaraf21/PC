package gw.financials

uses gw.api.domain.financials.PCFinancialsLogger
uses gw.currency.fxrate.FXRate
uses gw.pl.currency.MonetaryAmount

uses java.lang.IllegalStateException
uses java.lang.Integer
uses gw.api.database.Query
uses java.util.Collection
uses gw.api.util.FXRateUtil
uses gw.plugin.Plugins
uses gw.plugin.exchangerate.IFXRatePlugin
uses gw.financials.jobtypes.JobType
uses gw.financials.jobtypes.NormalForNonReportingJobType
uses gw.financials.jobtypes.NormalForReportingJobType
uses gw.financials.jobtypes.ReportForReportingJobType
uses gw.financials.jobtypes.FinalAuditJobType
uses java.util.Date

/**
 * Provides accessors to useful financial concepts, transaction calculation, and the high-level quote method of the
 * {@link entity.PolicyPeriod}.
 */
enhancement PolicyPeriodFinancialsEnhancement : PolicyPeriod {

  /**
   * Returns the date that the Term started for rating and prorating purposes.  Rewriting a cancelled policy
   * will sometimes change the start of the term and sometimes not, making it necessary to look at the history
   * of the policy to determine when the Rated Term started
  */
  property get StartOfRatedTerm() : Date {
    return this.PolicyTermPeriodStart.PeriodStart
  }

  /**
  * Finds the PolicyPeriod which defined the start of the Policy Term.  If the job has been rewritten, need to examine
  * the periods it was based on
   */
  protected property get PolicyTermPeriodStart() : PolicyPeriod {
    if ( this.PolicyTermInitiatedByRewrite ) {
      return this.BasedOn.PolicyTermPeriodStart
    }
    return this
  }

  /**
  * Returns true if this job is a rewrite of remainder of term or the job it is based on is.  If so, it's Policy Term
  * Start was defined by a previous period
   */
  protected property get PolicyTermInitiatedByRewrite() : boolean {
    if ( this.Status != PolicyPeriodStatus.TC_BOUND and this.Job typeis Rewrite and this.Job.RewriteType == TC_REWRITEREMAINDEROFTERM) {
      return true
    }
    else if ( this.Job typeis Renewal ) {
      return false
    }
    else { /* Use the first model in the term to determine which job triggered the new term */
      var job = this.Policy.BoundPeriods.firstWhere(\ p1 -> p1.TermNumber == this.TermNumber and p1.ModelNumber == 1).Job
      return job typeis Rewrite and job.RewriteType == TC_REWRITEREMAINDEROFTERM
    }
  }


  /**
   * Returns the number of days between the start and end of the policy period.
   *
   * @return the number of days in the range [PeriodStart, PeriodEnd).
   */
  property get NumDaysInPeriod() : int {
    var p = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    return p.financialDaysBetween(this.PeriodStart, this.PeriodEnd)
  }

  /**
   * Returns the number of days in this period that is uncanceled.  If the policy is not canceled, then this returns
   * the number of days in the period.
   *
   * @return the number of uncanceled days
   */
  property get NumDaysInUncanceledPeriod() : int {
    var p = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    return this.Canceled ? p.financialDaysBetween(this.PeriodStart, this.CancellationDate)
                         : p.financialDaysBetween(this.PeriodStart, this.PeriodEnd)
  }

  /**
   * Returns the number of days, relative to the period start, that the standard period should be.  If the product's
   * default period is a non-standard period, then return null.
   *
   * @return the number of days in the standard period; {@code null} if the period is a non-standard period.
   */
  property get NumDaysInStandardPeriod() : Integer {
    var termType = this.Policy.Product.DefaultTermType
    var p = Prorater.forFinancialDays(TC_PRORATABYDAYS)
    if (termType == "Annual") {
      return p.financialDaysBetween(this.PeriodStart, this.PeriodStart.addYears(1))
    } else if (termType == "HalfYear") {
      return p.financialDaysBetween(this.PeriodStart, this.PeriodStart.addMonths(6))
    }
    PCFinancialsLogger.logError("Unable to calculate standard period for unexpected default term type: " + termType)
    return null
  }

  /**
   * Returns the total of all the costs in this policy period that are subject to reporting . The total amount is in
   * the preferred settlement currency.
   *
   * @return the total cost that is subject to reporting
   */
  property get TotalSubjectToReporting() : MonetaryAmount {
    return this.AllCosts.where(\ c ->  c.SubjectToReporting).AmountSum(this.PreferredSettlementCurrency)
  }

  property get NonPremiumCosts() : Cost[] {
    return this.AllCosts.where(\c -> c.ChargePattern != ChargePattern.TC_PREMIUM)
  }

  /**
   * Calculates the transactions that led to the costs in this period from the otherPeriod.
   * If otherPeriod is null, then it calculates transactions against no costs.
   */
  function calculateTransactions() {
    var logMsg = displaykey.PolicyPeriod.Quote.Transactions.Calculating
    PCFinancialsLogger.logInfo(logMsg)

    this.clearAllTransactions()
    ensureCostsWithinBoundsOfPremiumReport()
    new PolicyPeriodTransactionCalculator(this).validateOnsetTransactions().calculateTransactions()

    PCFinancialsLogger.logInfo(displaykey.PolicyPeriod.Quote.Transactions.Done(logMsg))
  }

  function properlySetTransactionFlags() {
    for (t in this.AllTransactions) {
      var subjectToReporting = t.Cost.SubjectToReporting
      var subjectToAccrual = t.Cost.SubjectToAccrual
      var myJobType = this.determineJobType(subjectToReporting, t.Written)
      t.Charged = myJobType.Charged
      t.ToBeAccrued = subjectToAccrual and t.Charged
    }
  }

  /**
   * Returns the job type of this policy period.
   *
   * @return the job type {@link JobType} of the policy period
   */
  function determineJobType(subjectToReporting : boolean, whenWritten: boolean): JobType {
    switch(true) {
      // Non-reporting policies and costs not subject to reporting always calculate charged and written together
      case (!this.IsReportingPolicy || !subjectToReporting) :
        return new NormalForNonReportingJobType(whenWritten)
      // Non-audit jobs on reporting policies only ever calculate written amounts for reporting costs
      case (!(this.Job typeis Audit)) :
        return new NormalForReportingJobType(whenWritten)
      // Premium report jobs only ever calculate charged amounts for reporting costs
      case (this.Audit.AuditInformation.AuditScheduleType != "FinalAudit") :
        return new ReportForReportingJobType(whenWritten)
      // Final audits on reporting policies calculate written and charged separately for reporting costs
      default:
        return new FinalAuditJobType(whenWritten)
    }
  }

  /**
   * Return a collection of the policy foreign-exchange rates for this period.
   *
   * @return A collection of policy foreign-exchange rate instances
   *         for this period.
   */
  function loadPolicyFXRates() : Collection<PolicyFXRate> {
    return Query.make(PolicyFXRate)
        .compare("PolicyPeriod", Equals, this).select().toCollection()
  }

  /**
   * Find a policy foreign-exchange rate in the specified collection
   *    matching the specified foreign-exchange rate.
   *
   * This is used to identify an existing persistent policy foreign-exchange
   * rate corresponding to a calculation required foreign-exchange rate. If
   * not found, a new policy foreign-exchange rate is created and returned.
   *
   * @param rate The foreign-exchange rate for which to find a corresponding
   *             persistent copy
   * @param rates The policy foreign-exchange rates for this period.
   */
  function findOrCreatePolicyFXRate(rate : FXRate, policyFXRates : Collection<PolicyFXRate>) : PolicyFXRate {
    var storedRate = policyFXRates.firstWhere( \ rateEntry -> matchRates(rate, rateEntry) )
    if (storedRate == null) {
      storedRate = PolicyFXRate.valueOf(this, rate)
    }
    return storedRate
  }

  function findOrCreatePolicyFXRate(fromCurrency : Currency, toCurrency : Currency) : PolicyFXRate {
    var fxRatePlugin = Plugins.get(IFXRatePlugin)
    var rateContext = FXRateUtil.makeContextBuilder(fromCurrency, toCurrency).withMarketTime(this.EditEffectiveDate).buildContext()
    var rate = fxRatePlugin.getFXRate(rateContext)
    return findOrCreatePolicyFXRate(rate, this.PolicyFXRates as Collection<PolicyFXRate>)
  }

  //
  // PRIVATE SUPPORT METHODS
  //

  private function matchRates(rate1 : FXRate, rate2 : FXRate) : boolean {
    return rate1.FromCurrency == rate2.FromCurrency && rate1.ToCurrency == rate2.ToCurrency
        && rate1.MarketTime == rate2.MarketTime && rate1.RetrievedAt == rate2.RetrievedAt
        && rate1.Market == rate2.Market
  }

  private function ensureCostsWithinBoundsOfPremiumReport() {
    if (this.Audit != null) {
      var info = this.Audit.AuditInformation
      if (info.IsPremiumReport) {
        var start = info.AuditPeriodStartDate
        var end = info.AuditPeriodEndDate
        var outOfBoundsCosts = this.AllCosts.where(\ cost -> cost.EffectiveDate < start || cost.ExpirationDate > end)
        if (outOfBoundsCosts.Count > 0) {
          throw new IllegalStateException(displaykey.Rating.CostDatesOutOfBounds(outOfBoundsCosts.join("\n")))
        }
      }
    }
  }
}
