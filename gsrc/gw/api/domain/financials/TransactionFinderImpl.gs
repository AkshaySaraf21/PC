package gw.api.domain.financials

uses gw.entity.IEntityType
uses gw.api.database.Query
uses gw.api.database.ISelectQueryBuilder

@Export
internal class TransactionFinderImpl implements TransactionFinder {
  interface QueryProvider {
    function query(currentPeriod : PolicyPeriod, transactionType : IEntityType) : ISelectQueryBuilder
  }

  interface Transformer<F, T> {
    function transform(param : F) : T
  }

  private final var POSTED_NON_AUDIT_TRANSACTIONS : QueryProvider = \ currentPeriod, transactionType -> {
    var periodQuery = sameTermPeriodQuery(currentPeriod).compare("Status", Equals, PolicyPeriodStatus.TC_BOUND)
    return transactionQuery(periodQuery, transactionType)
  }

  private final var POSTED_TRANSACTIONS : QueryProvider = \ currentPeriod, transactionType -> {
    return postedTransactionQuery(currentPeriod, transactionType)
  }

  private final var PREVIOUSLY_POSTED_TRANSACTIONS : QueryProvider = \ currentPeriod, transactionType -> {
    var transactionQuery = postedTransactionQuery(currentPeriod, transactionType)
    if (currentPeriod.Job.CloseDate <> null) {
      transactionQuery.compare("PostedDate", LessThan, currentPeriod.Job.CloseDate)
    }
    return transactionQuery
  }

  override function findPostedNonAuditTransactions(currentPeriod : PolicyPeriod) : List<Transaction> {
    return transactions(currentPeriod, POSTED_NON_AUDIT_TRANSACTIONS)
  }

  override function findPostedPremiumReportTransactions(currentPeriod : PolicyPeriod, start : DateTime, end : DateTime) : List<Transaction> {
    return transactions(currentPeriod, new PostedPremiumReportTransactionQueryProvider(start, end))
  }

  override function findPostedTransactions(currentPeriod : PolicyPeriod) : List<Transaction> {
    return transactions(currentPeriod, POSTED_TRANSACTIONS)
  }

  override function findPreviouslyPostedTransactions(currentPeriod : PolicyPeriod) : List<Transaction> {
    return transactions(currentPeriod, PREVIOUSLY_POSTED_TRANSACTIONS)
  }

  private function postedTransactionQuery(currentPeriod : PolicyPeriod, transactionType : IEntityType) : ISelectQueryBuilder {
    return transactionQuery(sameTermPeriodQuery(currentPeriod), transactionType).compare("PostedDate", NotEquals, null)
  }

  private function sameTermPeriodQuery(currentPeriod : PolicyPeriod) : ISelectQueryBuilder<PolicyPeriod> {
    return Query.make(PolicyPeriod).compare("Period", Equals, currentPeriod.PeriodId)
  }

  private function transactionQuery(periodQuery : ISelectQueryBuilder<PolicyPeriod>, transactionType : IEntityType) : ISelectQueryBuilder {
    var transactionQuery = Query.make(transactionType)
    transactionQuery.subselect("BranchValue", CompareIn, periodQuery, "ID")
    return transactionQuery
  }

  private function transactions(currentPeriod : PolicyPeriod, provider : QueryProvider) : List<Transaction> {
    return flatResults(currentPeriod, new TransactionTransformer(currentPeriod, provider))
  }

  private function flatResults<T>(currentPeriod : PolicyPeriod, transformer : Transformer<IEntityType, List<T>>) : List<T> {
    return currentPeriod.TransactionTypes.flatMap(\ tt -> transformer.transform(tt))
  }

  class PostedPremiumReportTransactionQueryProvider implements QueryProvider {
    private var _start : DateTime
    private var _end : DateTime

    construct(start : DateTime, end : DateTime) {
      _start = start
      _end = end
    }

    override function query(currentPeriod : PolicyPeriod, transactionType : IEntityType) : ISelectQueryBuilder {
      var periodQuery = completedPeriodQuery(currentPeriod)
      periodQuery.subselect("Job", CompareIn, Job, "ID").cast(Audit)
        .subselect("AuditInformation", CompareIn, AuditInformation, "ID")
        .compare("AuditScheduleType", Equals, AuditScheduleType.TC_PREMIUMREPORT)
        .compare("AuditPeriodStartDate", GreaterThanOrEquals, _start)
        .compare("AuditPeriodEndDate", LessThanOrEquals, _end)
      return transactionQuery(periodQuery, transactionType)
    }

    private function completedPeriodQuery(currentPeriod : PolicyPeriod) : ISelectQueryBuilder<PolicyPeriod> {
      return sameTermPeriodQuery(currentPeriod).compareIn("Status", PolicyPeriod.statuses.PostedStatusSet.toArray())
    }
  }

  class TransactionTransformer implements Transformer<IEntityType, List<Transaction>> {
    private var _currentPeriod : PolicyPeriod
    private var _provider : QueryProvider

    construct(currentPeriod : PolicyPeriod, provider : QueryProvider) {
      _currentPeriod = currentPeriod
      _provider = provider
    }

    override function transform(transactionType : IEntityType) : List<Transaction> {
      return _provider.query(_currentPeriod, transactionType).select().iterator().toList() as List<Transaction>
    }
  }
}