package gw.webservice.pc.pc700.productmodel

uses gw.api.productmodel.OfferingLookup
uses gw.api.productmodel.Product
uses gw.api.productmodel.PolicyLinePatternLookup
uses gw.api.system.PCDependenciesGateway
uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.api.webservice.exception.ServerStateException
uses gw.api.webservice.exception.SOAPException
uses gw.api.webservice.exception.SOAPServerException
uses gw.api.webservice.pc.productmodel.ProductModelAPIImpl
uses gw.webservice.pc.pc700.gxmodel.clausepatternmodel.types.complex.ClausePattern
uses gw.webservice.pc.pc700.gxmodel.questionsetmodel.types.complex.QuestionSet
uses gw.webservice.SOAPUtil

uses java.util.Date
uses java.util.ArrayList
uses gw.api.productmodel.ProductLookup

/**
 * Provides service API methods for modifying the PolicyCenter product model.
 *
 * Modifying the Product Model definition has three major prerequisites:
 * <br/><br/>
 * 1. User must have permission - only an administrator may make modifications to the product model<br/>
 * 2. Server must not be in dev mode - the environment property gw.server.mode must be "dev"<br/>
 * 3. Server must be in maintenance mode - put the server in this mode before making any of the modification calls.
 * <br/><br/>
 * @author Allan Heydon, Victor Tso
 */
@Deprecated("as of PC 8.0.0.  Uses deprecated methods")
@gw.xml.ws.annotation.WsiWebService( "http://guidewire.com/pc/ws/gw/webservice/pc/pc700/productmodel/ProductModelAPI" )
@Export
class ProductModelAPI {

    /**
   * Return the list of available questions for the given policy period.
   * @param lookupRoot the information about the entity to look up availability on
   * @param offeringCode the offeringCode
   * @param lookupDate the date to look up
   * @return the list of available questions
   */
  @Throws(SOAPException, "If communication fails")
  @Throws(RequiredFieldException, "If any required field is null")
  @Throws(BadIdentifierException, "If cannot find an instance with specified id")
  function getAvailableQuestions(lookupRoot : LookupRootImpl,
                                  offeringCode : String,
                                  lookupDate : Date) : List<QuestionSet>{
    SOAPUtil.require(lookupRoot, "lookupRoot")
    SOAPUtil.require(lookupRoot.ProductCode, "lookupRoot.ProductCode")
    SOAPUtil.require(lookupDate, "lookupDate")
    var product = ProductLookup.getByCode(lookupRoot.ProductCode)
    if(product == null){
      throw new BadIdentifierException(displaykey.JobAPI.CantFindProductCode(lookupRoot.ProductCode))
    }
    var coverableType = lookupRoot.lookupType()
    if(coverableType == null){
      throw new BadIdentifierException(displaykey.JobAPI.CantFindEntity(lookupRoot.LookupTypeName))
    }
    var offering = OfferingLookup.getByCode(offeringCode)
    var allQuestionSets = product.getQuestionSets(PolicyPeriod)
    var results = new ArrayList<QuestionSet>()
    for(questionSet in allQuestionSets){
      // filter out questionsets
      if(questionSet.maybeQuestionSetAvailable(lookupRoot, lookupDate, offering)){
        var questionSetModel = new gw.webservice.pc.pc700.gxmodel.questionsetmodel.QuestionSet(questionSet)
        // filter out question
        questionSetModel.Questions.Entry.removeWhere(\ q ->
          not questionSet.getQuestion(q.Code).maybeQuestionAvailable(lookupRoot, lookupDate)  
        )
        results.add(questionSetModel.$TypeInstance)
      }
    }
    return results
  }
  
  /**
   * Return the list of available clause pattern for the given parameters.
   * @param lookupRoot the information about the entity to look up availability on
   * @param offeringCode the offeringCode
   * @param lookupDate the date to look up
   * @return the list of available coverage patterns and covterms
   */
  @Deprecated("as of PC8.0.0.  Uses deprecated methods")
  @Throws(SOAPException, "If communication fails")
  @Throws(RequiredFieldException, "If any required field is null")
  @Throws(BadIdentifierException, "If cannot find an instance with specified id")
  function getAvailableClausePatterns(lookupRoot : LookupRootImpl,
                                      offeringCode : String,
                                      lookupDate : Date) : List<ClausePattern>{
    SOAPUtil.require(lookupRoot, "lookupRoot")
    SOAPUtil.require(lookupRoot.PolicyLinePatternCode, "lookupRoot.PolicyLinePatternCode")
    SOAPUtil.require(lookupDate, "lookupDate")
    var linePattern = PolicyLinePatternLookup.getByCode(lookupRoot.PolicyLinePatternCode)
    if(linePattern == null){
      throw new BadIdentifierException(displaykey.JobAPI.CantFindPolicyLinePattern(lookupRoot.PolicyLinePatternCode))
    }
    var coverableType = lookupRoot.lookupType()
    if(coverableType == null){
      throw new BadIdentifierException(displaykey.JobAPI.CantFindEntity(lookupRoot.LookupTypeName))
    }
    var allPatterns = PCDependenciesGateway.getProductModel().getClausePatternsForEntity(lookupRoot.LookupTypeName);
    var offering = OfferingLookup.getByCode(offeringCode)
    var results = new ArrayList<ClausePattern>()
    for(pattern in allPatterns){
      if(pattern.maybeAvailable(lookupRoot, linePattern, lookupDate, offering)){
        var result = new gw.webservice.pc.pc700.gxmodel.clausepatternmodel.ClausePattern(pattern).$TypeInstance
        var ctx = pattern.getCovTermAvailabilityContext(lookupRoot, linePattern, lookupDate)
        for(covTerm in pattern.CovTerms){
          if(not covTerm.maybeAvailable(ctx, offering, linePattern)){
            result.CovTerms.Entry.removeWhere(\ c -> c.Code == covTerm.Code)
          }
        }
        results.add(result)
      }
    }
    return results
  }  

  /**
   * Synchronizes the contents of the database's product model to the contents of the server's XML configuration.
   * This is important to call in order to relay implicit delete information to the database after a sync to
   * source control or hand-edits of the XML.
   */
  @Throws(ServerStateException, "If the server is not in maintenance mode or is not in dev mode.")
  @Throws(SOAPServerException, "If the user does not have permission to access this functionality or an error occurs while doing the synchronization.")
  function synchronizeProductModel(){
    new ProductModelAPIImpl().synchronizeProductModel()
  }

  /**
   * Synchronizes the contents of the database's system tables to the contents of the server's XML configuration.
   * This is important to call in order to relay implicit delete information to the database after a sync to
   * source control or hand-edits of the XML.
   */
  @Throws(ServerStateException, "If the server is not in maintenance mode or is not in dev mode.")
  @Throws(SOAPServerException, "If the user does not have permission to access this functionality or an error occurs while doing the synchronization.")
  function synchronizeSystemTables() {
    new ProductModelAPIImpl().synchronizeSystemTables()
  }
}