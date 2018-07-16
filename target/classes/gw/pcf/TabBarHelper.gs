package gw.pcf

uses java.util.Date

@Export
class TabBarHelper {

  public static function accountSearch(searchText : String) : entity.Account { 
    var acct = Account.finder.findAccountByAccountNumber(searchText)
    if (acct != null and not User.util.CurrentUser.canView(acct)) {
      acct = null
    }
    return acct
  }
  
  public static function jobFinder(searchText : String) : entity.Job {
    var job = Job.finder.findJobByJobNumber(searchText)
    if (job != null and not User.util.CurrentUser.canView(job)) {
      job = null
    }
    return job
  }
  
  public static function periodFinder(searchText : String) : entity.PolicyPeriod {
   return Policy.retrievePeriod(searchText, Date.Today)
  }
}
