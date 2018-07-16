package gw.policy

uses gw.api.database.Query
uses gw.api.policy.period.PolicyPeriodQueryFilters

uses java.util.Date
uses gw.losshistory.ClaimSearchCriteria
uses gw.plugin.claimsearch.NoResultsClaimSearchException
uses java.lang.Exception

enhancement PolicyTermEnhancement : PolicyTerm {
  property get PolicyNumber() : String {
    return getPeriodAsOf(DateTime.Today).PolicyNumber
  }

  property get PolicyNumberDisplayString() : String {
    return getPeriodAsOf(DateTime.Today).PolicyNumberDisplayString
  }

  property get Periods() : PolicyPeriod[] {
    return this.Policy.Periods.where(\ period -> period.PolicyTerm == this)
  }

  /**
   * Returns policy period as of the given date, or last bound period if the period is null asOf date
   * @param date the date to be checked
   * @return policy period
   */
  function getPeriodAsOf(date : DateTime) : PolicyPeriod {
    var period = entity.Policy.finder.findPolicyPeriodByPolicyAndAsOfDate(this.Policy, date)
    if (period == null) {
      period = this.Policy.Periods.last()
    }
    return period
  }

  function removePreRenewalDirection() {
    //clear out the fields that represent pre-renewal direction
    this.PreRenewalDirection = null
    this.NonRenewAddExplanation = null
    this.NonRenewReason = null
    this.NonRenewalExplanations.each( \ n -> this.removeFromNonRenewalExplanations( n ) )
  }

  function getAvailableNonRenewalExplanationPatterns() : NonRenewalExplanationPattern[]{
    var currentDate = Date.CurrentDate
    var existingPatternList = this.NonRenewalExplanations.map( \ n -> n.Code ).toList()
    var result = Query.make(NonRenewalExplanationPattern)
      .and(\ andRestriction -> andRestriction
        .or(\ restriction -> {
          var effDateColumnName = NonRenewalExplanationPattern#EffectiveDate.PropertyInfo.Name
          restriction.compare(effDateColumnName, Equals, null)
          restriction.compare(effDateColumnName, LessThanOrEquals, currentDate)
        })
        .or(\ restriction -> {
          var expDateColumnName = NonRenewalExplanationPattern#ExpirationDate.PropertyInfo.Name
          restriction.compare(expDateColumnName, Equals, null)
          restriction.compare(expDateColumnName, GreaterThanOrEquals, currentDate)
        })
      ).select().where(\ n -> not existingPatternList.contains( n.Code )).toTypedArray()
    return result
  }

  @Deprecated("In PC 8.0.  Use getAvailableNonRenewalExplanationPatterns directly instead.")
  function findEffectiveNonRenewalExplanationPattern() : NonRenewalExplanationPatternQuery {
    var currentDate = Date.CurrentDate

    var result = Query.make(NonRenewalExplanationPattern)
      .and(\ andRestriction -> andRestriction
        .or(\ restriction -> {
          restriction.compare("EffectiveDate", Equals, null)
          restriction.compare("EffectiveDate", LessThanOrEquals, currentDate)
        })
        .or(\ restriction -> {
          restriction.compare("ExpirationDate", Equals, null)
          restriction.compare("ExpirationDate", GreaterThan, currentDate)
        })
      ).select()
    return result
  }

  function createPreRenewalDirectionHistoryDescription(originalValue : typekey.PreRenewalDirection) : String{
    return originalValue == null ?
           displaykey.Web.History.PreRenewal.PreRenewalDirectionSet( this.PreRenewalDirection ) : displaykey.Web.History.PreRenewal.PreRenewalDirection( originalValue, this.PreRenewalDirection )
  }

  function createNonRenewalReasonHistoryDescription(originalValue : NonRenewalCode) : String{
    return originalValue == null ?
           displaykey.Web.History.PreRenewal.NonRenewReasonSet( this.NonRenewReason ) : displaykey.Web.History.PreRenewal.NonRenewReason( originalValue, this.NonRenewReason )
  }

  function createNonRenewalAdditionalExplanationHistoryDescription() : String{
    return displaykey.Web.History.PreRenewal.NonRenewAddExplanation
  }

  function createPreRenewalAssignmentHistoryDescription(assignment : UserRoleAssignment) : String{
     return displaykey.Web.History.PreRenewal.AssignmentUser( assignment.AssignedUser)
  }

  function createNonRenewalExplanationRemovedHistoryDescription() : String{
     return displaykey.Web.History.PreRenewal.NonRenewalExplanations.Remove
  }

  function createNonRenewalExplanationAddedHistoryDescription() : String{
     return displaykey.Web.History.PreRenewal.NonRenewalExplanations.Add
  }

  function findMostRecentPeriod() : PolicyPeriod {
    var query = Query.make(PolicyPeriod)
    var termTable = query.join("PolicyTerm")
    termTable.compare("ID", Equals, this.ID)
    PolicyPeriodQueryFilters.inForce(query)
    return query.select().AtMostOneRow
  }

  function recalculateLossRatio()  : String {
    var message : String
    // try is used mostly in case of failure to commit the bundle
    try {
      var aPeriod = this.Periods.firstWhere( \ elt -> elt.MostRecentModel)
      // this will not work for multiline policies
      if (aPeriod.MultiLine) {
        return displaykey.Web.Policy.LossRatioUnavailableForMultilinePolicies
      }

      // find all claims associated with this PolicyTerm
      var claimSet = new ClaimSet()
      var criteria = new ClaimSearchCriteria()
      criteria.Policy = this.Policy
      criteria.DateCriteria.StartDate = aPeriod.PeriodStart
      criteria.DateCriteria.EndDate = aPeriod.PeriodEnd
      criteria.DateCriteria.DateSearchType = DateSearchType.TC_ENTEREDRANGE

      try {
        claimSet = criteria.performSearch()
      } catch (ex : NoResultsClaimSearchException) {
        // no action but set message
        message = displaykey.Web.Policy.NoClaimsFound
      } catch (ex : java.net.ConnectException) {
        return displaykey.Web.Policy.UnableToConnectToClaimSystem
      }
      // sum the TotalIncurred
      var totalIncurred = 0bd.ofCurrency(aPeriod.PreferredSettlementCurrency)
      claimSet.Claims.each( \ claim -> {
        if (claim.TotalIncurred != null ) {
          totalIncurred += claim.TotalIncurred
        }
      })

      // calculate the Earned Premium
      // remember this is for only monoline policies
      var txs = gw.api.domain.financials.TransactionFinder.instance.findPostedTransactions(aPeriod)
      var txsByPolicyLine = txs.partition(\ t -> t.Cost.PolicyLine.Pattern.Name)
      var aLine = txsByPolicyLine.Keys.first()
      var lastReportedDate = !aPeriod.Archived ? (aPeriod.IsReportingPolicy ? aPeriod.LastReportedDate : aPeriod.PeriodStart) : gw.api.system.PLDependenciesGateway.getSystemClock().DateTime
      var earned = (txsByPolicyLine.get(aLine)).
          sum(aPeriod.PreferredSettlementCurrency, \ t -> t.earnedAsOf(Date.Today, lastReportedDate, true))

      // protect against border conditions and divide by zero
      if ( earned.Amount <= 0bd) {
        return displaykey.Web.Policy.EarnedPremiumIsZeroLossRatioCannotBeCalculated
      }

      // set the loss ratio and calc date
      this.ClaimSystemTotalIncurred = totalIncurred
      this.LossRatio = (100 * totalIncurred.Amount / earned.Amount).setScale(2, HALF_UP)
      this.LossRatioCalculationDate = Date.Today
      this.Bundle.commit()
  } catch (ex : Exception) {
      message = displaykey.Web.Policy.UnableToCalculateOrSaveLossRatio
    }
    return message
  }
}
