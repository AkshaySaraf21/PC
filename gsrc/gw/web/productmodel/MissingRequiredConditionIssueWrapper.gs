package gw.web.productmodel

/**
 * Wrapper class for missing required condition issues.  Missing required condition issues are always fixed
 * and always displayed to the user.
 */
@Export
class MissingRequiredConditionIssueWrapper extends ProductModelSyncIssueWrapper<gw.api.web.productmodel.MissingRequiredConditionIssue> {

  construct(myIssue : gw.api.web.productmodel.MissingRequiredConditionIssue) {
    super(myIssue)
  }
  
  override property get BaseMessage() : String {
    if (Issue.Fixed) {
      return displaykey.Web.JobWizard.ProductModelSync.MissingRequiredClauseAdded(Issue.Pattern.DisplayName)
    } else {
      return displaykey.Web.JobWizard.ProductModelSync.MissingRequiredClauseNotAdded(Issue.Pattern.DisplayName)
    }
  }

  override property get Severity() : ProductModelSyncIssueSeverity {
    if (Issue.Fixed) {
      return WARNING  
    } else {
      return ERROR
    }
  }
  
  override property get ShouldFixDuringNormalSync() : boolean { return true }
  
  override property get ShouldDisplayDuringNormalSync() : boolean { return true }
  
  override property get ShouldFixDuringQuote() : boolean { return false }
  
  override property get ShouldDisplayDuringQuote() : boolean { return true }

}
