package gw.financials
uses java.lang.IllegalArgumentException

@Export
class PostedTransactionFinder {

  construct() {
  }
  
  // Does not accept null
  static function findPostedTransactions(thisPeriod : PolicyPeriod) : List<Transaction> {
    if (thisPeriod == null) {
      throw new IllegalArgumentException("Cannot pass a null period to the findPostedTransactions method")
    }

    switch (typeof(thisPeriod.Job)) {
      case Submission:
      case Renewal:
      case Rewrite:
      case RewriteNewAccount:
        return {}
        
      case Issuance:
      case PolicyChange:
      case Cancellation:
      case Reinstatement:
        return Transaction.finder.findPostedNonAuditTransactions(thisPeriod)
        
      case Audit:
        if (thisPeriod.Audit.AuditInformation.AuditScheduleType == "PremiumReport") {
          return Transaction.finder.findPostedPremiumReportTransactions(thisPeriod, 
                     thisPeriod.Audit.AuditInformation.AuditPeriodStartDate, 
                     thisPeriod.Audit.AuditInformation.AuditPeriodEndDate) 
        } else if (thisPeriod.Audit.AuditInformation.AuditScheduleType == "FinalAudit") {
          return Transaction.finder.findPostedTransactions(thisPeriod)
        } else {
          throw "Unexpected audit type " + thisPeriod.Audit.AuditInformation.AuditScheduleType
        }
        
      default:
        throw "Unexpected job type " + typeof(thisPeriod.Job)
    }
  }
}
