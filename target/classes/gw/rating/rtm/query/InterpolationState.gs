package gw.rating.rtm.query

uses gw.rating.rtm.domain.OrderedPersistenceAdapter
uses java.lang.Comparable
uses gw.rating.rtm.matchop.InterpolatingMatchOperator
uses java.util.Comparator
uses gw.rating.rtm.matchop.StatelessMatchOperator
uses java.util.Arrays
uses java.lang.SuppressWarnings

@Export
class InterpolationState {
  var _tableDef  : RateTableDefinition as readonly TableDefinition
  var _index     : int as readonly InterpolatedMatchOpIndex
  var _rowsBelow : List<OrderedPersistenceAdapter> as readonly RowsBelow
  var _rowsEqual : List<OrderedPersistenceAdapter> as readonly RowsEqual
  var _rowsAbove : List<OrderedPersistenceAdapter> as readonly RowsAbove
  var _matchOp : InterpolatingMatchOperator as readonly MatchOp
  var _params : Comparable[] as readonly InputParams

  construct(tableDef : RateTableDefinition, op : InterpolatingMatchOperator, matchOpIndex : int, paramValues : Comparable[]) {
    _matchOp = op
    _params = paramValues
    _index = matchOpIndex
    _tableDef = tableDef
  }

  private construct(s : InterpolationState, below : List<OrderedPersistenceAdapter>, equal : List<OrderedPersistenceAdapter>, above : List<OrderedPersistenceAdapter>) {
    this(s.TableDefinition, s.MatchOp, s.InterpolatedMatchOpIndex, s.InputParams)
    _rowsBelow = below
    _rowsEqual = equal
    _rowsAbove = above
  }

  function withRows(below : List<OrderedPersistenceAdapter>, equal : List<OrderedPersistenceAdapter>, above : List<OrderedPersistenceAdapter>) : InterpolationState {
    return new InterpolationState(this, below, equal, above)
  }

  function addRowsBelow(below : List<OrderedPersistenceAdapter>) : InterpolationState {
    return withRows(below, this.RowsEqual, this.RowsAbove)
  }

  function addRowsEqual(equal : List<OrderedPersistenceAdapter>) : InterpolationState {
    return withRows(this.RowsBelow, equal, this.RowsAbove)
  }

  function addRowsAbove(above : List<OrderedPersistenceAdapter>) : InterpolationState {
    return withRows(this.RowsBelow, this.RowsEqual, above)
  }

  property get HasRowsBelow() : boolean {
    return RowsBelow?.size() > 0
  }

  property get HasRowsAbove() : boolean {
    return RowsAbove?.size() > 0
  }

  property get HasRowsEqual() : boolean {
    return RowsEqual?.size() > 0
  }

  @SuppressWarnings("all") // complains about while loop...but for() creates an iterator and Comparator is in a tight inner loop.
  static function getComparator(matchOps : List<StatelessMatchOperator>, numActiveOps : int, params : Comparable[]) : Comparator<OrderedPersistenceAdapter> {
    final var sortingOps = matchOps.where(\ mo -> mo.OrderDependent and mo.ArgIndex < numActiveOps).toTypedArray()

    if (sortingOps.length == 0) {
      return \ a, b -> 0
    } else if (sortingOps.length == 1) {
      final var op = sortingOps[0]
      final var param = params[op.ArgIndex]
      return \ a, b -> op.getScore(a, param).compareTo(op.getScore(b, param))
    } else return new Comparator<OrderedPersistenceAdapter>() {
      override function compare(a : OrderedPersistenceAdapter, b : OrderedPersistenceAdapter) : int {
        var i = 0 // while loop is cheaper than for because for creates an iterator
        while (i < sortingOps.length) {
           var op = sortingOps[i]
          i++
           var v = op.getScore(a, params[op.ArgIndex]).compareTo(op.getScore(b, params[op.ArgIndex]))
           if (v != 0) return v
        }

        return 0
      }
    }
  }

  static function findHighestScoringRow(comparator : Comparator<OrderedPersistenceAdapter>, factorRows: List<OrderedPersistenceAdapter>): OrderedPersistenceAdapter  {
    if (factorRows == null or factorRows.size() == 0) return null

    var numRows = factorRows.size()
    var bestRow = factorRows.get(0)
    for (newRow in factorRows) {
      if (comparator.compare(newRow, bestRow) > 0) {
        bestRow = newRow
      }
    }
    return bestRow
  }

  static function findTwoBestRows(comparator : Comparator<OrderedPersistenceAdapter>, factorRows: List<OrderedPersistenceAdapter>): List<OrderedPersistenceAdapter>  {
    if (factorRows == null or factorRows.size() == 0) return null

    if (factorRows.size() < 2) return factorRows

    var numRows = factorRows.size()
    var best = factorRows.get(0)
    var second = factorRows.get(1)

    if (comparator.compare(best, second) < 0) {
      var t = best
      best = second
      second = t
    }

    for (newRow in factorRows.subList(2, factorRows.size())) {
      if (comparator.compare(newRow, second) > 0) {
        second = newRow
        if (comparator.compare(best, second) < 0) {
          var t = best
          best = second
          second = t
        }
      }
    }

    return {best, second}
  }

  function getRowSorter(final matchOps: List<StatelessMatchOperator>,
                        final numActiveOps: int,
                        final numRowsNeeded : int) : block(l : List<OrderedPersistenceAdapter>): List<OrderedPersistenceAdapter> {

    final var comparator = getComparator(matchOps, numActiveOps, InputParams)

    switch (numRowsNeeded) {
      case 1:  return \ rowList -> {
        var row = findHighestScoringRow(comparator, rowList)
        return row == null ? null : Arrays.asList({ row })
      }

      case 2:  return \ rowList -> findTwoBestRows(comparator, rowList)

      // general sorting case.   This could be slow, but there are diminishing returns for special-coding longer sequences.
      default: return \ rowList -> {
          if (rowList == null or rowList.size() < numRowsNeeded) return null

          return rowList.sort( \ elt1, elt2 -> comparator.compare(elt1, elt2) > 0)
      }
    }
  }
}