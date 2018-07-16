package servlet.webservice

uses org.springframework.web.bind.annotation.RestController
uses org.springframework.web.bind.annotation.RequestMapping
uses java.util.ArrayList
uses org.springframework.web.bind.annotation.RequestMethod

uses servlet.util.PolicyUtility
uses servlet.dto.PolicyDTO
uses org.springframework.web.bind.annotation.PathVariable

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 7/6/18
 * Time: 3:50 PM
 * To change this template use File | Settings | File Templates.
 */
@RestController
@RequestMapping(: value = {"/test"})
class TestController {
  @RequestMapping(: method = {RequestMethod.GET})
  public function get(): List<String> {
    var list = new ArrayList<String>()
    list.add("Akshay")
    list.add("saraf")

    return list
  }

  @RequestMapping(: method = {RequestMethod.POST}, : value = {"/getPolicy/{policy}"})
  public function getPolicyDetails(@PathVariable("policy")
                                   policyNumber: String): PolicyDTO {
    var policy: Policy
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      policy = PolicyUtility.getPolicyByPolicyNumber(policyNumber)
    }, "su")
    return PolicyUtility.toDTO(policy)
  }
}