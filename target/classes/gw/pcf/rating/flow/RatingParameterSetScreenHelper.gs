package gw.pcf.rating.flow

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.productmodel.PolicyLinePattern
uses gw.lang.reflect.TypeSystem
uses gw.util.Pair
uses gw.util.concurrent.LocklessLazyVar

uses java.util.Set
uses gw.api.productmodel.CoveragePattern

@Export
class RatingParameterSetScreenHelper {
  /**
   * Add additional default CalcRoutineParamName -> Type default values.  These
   * values are used in the Calc Routine Parameter screens to fill in default
   * values when add parameters to a parameter set.
   */
  private static var mapFromCodeToType = {
      CalcRoutineParamName.TC_POLICYLINE           -> "entity.PolicyLine",
//      CalcRoutineParamName.TC_CPCOV                -> "gw.lob.cp.rating.AvailableCoverageWrapper",
      CalcRoutineParamName.TC_RATEDATE             -> "java.util.Date",
      CalcRoutineParamName.TC_COVERAGE             -> "entity.Coverage",
      CalcRoutineParamName.TC_COSTDATA             -> "gw.rating.CostData",
      CalcRoutineParamName.TC_DRIVERASSIGNMENTINFO -> "gw.lob.pa.rating.DriverAssignmentInfo",
      CalcRoutineParamName.TC_TAXABLEBASIS         -> "java.math.BigDecimal",
      CalcRoutineParamName.TC_STATE                -> "typekey.Jurisdiction"
  }

  private var _linePattern: String as LinePattern

  private var _paramSetsReferencedInRoutinesFromPromotedBooks = new LocklessLazyVar<Set<String>>() {
    override function init(): Set<String> {
      return CalcRoutineParameterSet.getParamSetsReferencedForRoutinesInPromotedBook()
    }
  }

  private var _paramSetsReferencedInRateTableDefinitions = new LocklessLazyVar<Set<String>>() {
    override function init(): Set<String> {
      return CalcRoutineParameterSet.getParamSetsReferencedInRateTableDefinitions()
    }
  }

  private var _paramSetsReferencedInPromotedBooksViaRateTableDefinitions = new LocklessLazyVar<Set<String>>() {
    override function init(): Set<String> {
      return CalcRoutineParameterSet.getParamSetsReferencedInRateTableDefinitionsInPromotedBooks()
    }
  }

  private var _parametersReferencedInRateTableDefinitionsRateRoutinesRateFunctions = new LocklessLazyVar<Set<Pair<entity.CalcRoutineParameterSet, typekey.CalcRoutineParamName>>>() {
    override function init(): Set<Pair<entity.CalcRoutineParameterSet, typekey.CalcRoutineParamName>> {
      return ParametersReferencedInRateTableDefinitions
          .union(ParametersReferencedInRateRoutines)
          .union(ParametersReferencedInFunctions)
    }
  }

  /**
   * Returns the parameter sets for our line pattern
   */
  property get ParameterSets(): IQueryBeanResult<CalcRoutineParameterSet> {
    var query = Query<CalcRoutineParameterSet>.make(CalcRoutineParameterSet)
    if (_linePattern.NotBlank) {
      query.compare("PolicyLinePatternCode", Equals, _linePattern)
    }
    return query.select()
  }

  /**
   * Returns the associated type for a calc routine param name
   */
  static function codeToDefaultType(code: CalcRoutineParamName): String {
    return mapFromCodeToType[code]
  }

  // --- ParameterSet helpers

  function newParameterSet(): CalcRoutineParameterSet {
    var newSet = new CalcRoutineParameterSet()
    newSet.PolicyLinePatternCode = _linePattern
    newSet.IncludesCost = false
    return newSet
  }

  function canRemoveParameterSet(paramSet: CalcRoutineParameterSet): boolean {
    return not _paramSetsReferencedInRoutinesFromPromotedBooks.get().contains(paramSet.Code)
        and not _paramSetsReferencedInRateTableDefinitions.get().contains(paramSet.Code)
  }

  function editVisibleForParameterSet(paramSet: CalcRoutineParameterSet): boolean {
    return not _paramSetsReferencedInRoutinesFromPromotedBooks.get().contains(paramSet.Code)
        and not _paramSetsReferencedInPromotedBooksViaRateTableDefinitions.get().contains(paramSet.Code)
  }

  function canEditParameterSet(paramSet: CalcRoutineParameterSet): boolean {
    return not _paramSetsReferencedInRoutinesFromPromotedBooks.get().contains(paramSet.Code)
        and not _paramSetsReferencedInPromotedBooksViaRateTableDefinitions.get().contains(paramSet.Code)
  }

  function validateParameterSet(parameterSet: CalcRoutineParameterSet): String {
    // check for duplicate codes in the parameter set
    var duplicateCodes = parameterSet.Parameters*.Code.partition(\ c -> c.Code).filterByValues(\ l -> l.Count > 1).Keys
    if (duplicateCodes.HasElements) {
      return displaykey.Validation.Rating.ParameterSet.DuplicateParameterCode(duplicateCodes.join(","))
    }
    return null
  }

  // --- Parameter helpers

  function newParameter(parameterSet: CalcRoutineParameterSet): CalcRoutineParameter {
    var newParam = new CalcRoutineParameter()
    newParam.CalcRoutineParameterSet = parameterSet
    return newParam
  }

  function canRemoveParameter(parameterSet: CalcRoutineParameterSet, parameter: CalcRoutineParameter): boolean {
    return not _paramSetsReferencedInRoutinesFromPromotedBooks.get().contains(parameterSet.Code)
        and not _paramSetsReferencedInPromotedBooksViaRateTableDefinitions.get().contains(parameterSet.Code)
  }

  function canEditParameter(parameterSet: CalcRoutineParameterSet, parameter: CalcRoutineParameter): boolean {
    return parameter.Code == null or canRemoveParameter(parameterSet, parameter)
  }

  function parameterCoverageAvailable(parameterSet: CalcRoutineParameterSet, parameter: CalcRoutineParameter): boolean {
    return parameter.ParamType == "entity.Coverage" and parameterSet.PolicyLinePatternCode != null
  }

  function parameterWrapperMode(parameterSet: CalcRoutineParameterSet, parameter: CalcRoutineParameter) : String {
    if (parameterCoverageAvailable(parameterSet, parameter)) {
      return parameter.UseWrapper ? "wrapper" : "coverage"
    } else {
      return "default"
    }
  }

  function validateCoverageParameter(linePattern: PolicyLinePattern, parameter: CalcRoutineParameter): String {
    // non-null parameter must contain a valid coverage code
    var coveragePatternCode = parameter.CoveragePattern
    if (coveragePatternCode != null) {
      if (linePattern.getClausePattern(CoveragePattern, coveragePatternCode) == null) {
        return displaykey.Validation.Rating.InvalidCoveragePatternCode(coveragePatternCode)
      }
    }
    return null
  }

  static function validateParameterType(paramImplClassName : String): String {
    // non-null parameter must be of a valid type
    if (paramImplClassName!= null) {
      var classType = TypeSystem.getByFullNameIfValid(paramImplClassName)
      if (classType == null) {
        return displaykey.Java.ValidationError.SystemTables.InvalidClassName(paramImplClassName)
      }
    }
    return null
  }

  static function validateWrapper(linePattern: String, className: String): String {
    if (className != null) {
      var criteria = new CoverageWrapperSearchCriteria(linePattern)
      if(not criteria.containsResult(className)) {
        return displaykey.Java.ValidationError.SystemTables.InvalidClassName(className)
      }
      return validateParameterType(className)
    }
    return null
  }

  static function isUseWrapperEditable(parameterSet: CalcRoutineParameterSet, parameter: CalcRoutineParameter): boolean {
    if (parameterSet.PolicyLinePatternCode <> null) return true
    parameter.UseWrapper = false
    return false
  }

  // --- non-public entries ---

  private static property get ParametersReferencedInRateTableDefinitions(): Set<Pair<CalcRoutineParameterSet, CalcRoutineParamName>> {
    return Query.make(RateTableArgumentSource)
        .select()
        .map(\ r ->
            new gw.util.Pair<entity.CalcRoutineParameterSet, typekey.CalcRoutineParamName>
                (r.ArgumentSourceSet.CalcRoutineParameterSet, r.Root))
        .toSet()
  }

  private static property get ParametersReferencedInRateRoutines(): Set<Pair<CalcRoutineParameterSet, CalcRoutineParamName>> {
    return Query.make(CalcStepDefinitionOperand).compare("InScopeParam", NotEquals, null)
        .join("CalcStep").join("CalcRoutineDefinition")
        .select()
        .map(\ r ->
            new gw.util.Pair<entity.CalcRoutineParameterSet, typekey.CalcRoutineParamName>
                (r.CalcStep.CalcRoutineDefinition.ParameterSet, r.InScopeParam))
        .toSet()
  }

  private static property get ParametersReferencedInFunctions()
      : Set<Pair<CalcRoutineParameterSet, CalcRoutineParamName>> {
    return Query.make(CalcStepDefinitionArgument)
        .compare("OperandType", Equals, CalcStepOperandType.TC_INSCOPE)
        .join("Operand").compare("FunctionName", NotEquals, null)
        .join("CalcStep").join("CalcRoutineDefinition")
        .select()
        .map(\ r ->
            new gw.util.Pair<entity.CalcRoutineParameterSet, typekey.CalcRoutineParamName>
                (r.Operand.CalcStep.CalcRoutineDefinition.ParameterSet, r.InScopeParam))
        .toSet()
  }
}
