package servlet

uses gw.servlet.Servlet
uses javax.servlet.http.HttpServlet
uses javax.servlet.http.HttpServletResponse
uses javax.servlet.http.HttpServletRequest
uses java.lang.StringBuffer
uses servlet.dto.TestDTO
uses java.io.PrintWriter
uses servlet.dto.PolicyDTO
uses servlet.util.PolicyUtility
uses servlet.exception.PortalException
uses org.openqa.selenium.remote.JsonException
uses servlet.dto.AccountDTO
uses servlet.util.AccountUtil
uses servlet.dto.RenewalDTO
uses java.util.HashMap

uses org.json.simple.parser.JSONParser
uses org.json.simple.JSONObject

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/19/18
 * Time: 11:13 PM
 * To change this template use File | Settings | File Templates.
 */
@Servlet(\path: String -> path.matches("/api(/.*)?"))
class JsonServlet extends HttpServlet {
  private static var cache = new HashMap<String, HashMap<String, String>>()
  override function doGet(req: HttpServletRequest, resp: HttpServletResponse) {
  /*  var intent = req.getPathInfo().split("/").last()
    if (intent == "getData") {
      print("Request aaya")

      resp.setContentType("application/json")
      var gson = new Gson()
      var map = cache.get("data")
      var json = new JSONObject();
      if (cache.size() > 0)  {
        for (var entry in map.entrySet()) {
          var myClassJson = entry.getValue();
          var parser = new JSONParser();
          var jsons = parser.parse(myClassJson) as JSONObject
          json.put(entry.getKey(), jsons);
        }
      }
      cache.clear()

      //var json = gson.toJson(cache.get("data"))
      var out: PrintWriter
      out = resp.getWriter();
      out.print(json)
      out.close()
    } else {
      resp.sendError(404)
    }*/
  }

  override function doPost(req: HttpServletRequest, resp: HttpServletResponse) {
   /* var clientOrigin = req.getHeader("origin")
    resp.addHeader("Access-Control-Allow-Origin", "*");
    resp.addHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, HEAD");
    resp.addHeader("Access-Control-Allow-Headers", "X-PINGOTHER, Origin, X-Requested-With, Content-Type, Accept");
    resp.addHeader("Access-Control-Max-Age", "1728000");
    var intent = req.getPathInfo().split("/").last()
    var map = new HashMap<String, String>()
    var key: String
    var isDataFound = false
    var reader = req.getReader()
    var line = reader.readLine()
    var lines = new StringBuffer()
    while (line != null) {
      lines.append(line);
      line = reader.readLine()
    }
    var gson = new Gson();
    var json: String
    if (intent == "getPolicyDetails")
    {
      key = "PolicyDetails"
      var dto = gson.fromJson(lines.toString(), PolicyDTO.Type)
      try {
        var policy = PolicyUtility.getPolicyByPolicyNumber(dto.PolicyNumber)
        dto = PolicyUtility.toDTO(policy)
        isDataFound = true
      } catch (e: PortalException) {
        dto.IsPolicyFound = false
      }

      json = gson.toJson(dto)
    }
    else if (intent == "getAccountDetails")
    {
      key = "AccountDetails"
      var dto = gson.fromJson(lines.toString(), AccountDTO.Type)
      try {
        var acc = AccountUtil.getAccountByAccountNumber(dto.AccountNumber)
        dto = AccountUtil.toDTO(acc)
        isDataFound = true
      } catch (e: PortalException) {
        dto.IsAccountFound = false
      }

      json = gson.toJson(dto)
    }
    else if (intent == "getRenewalDetails") {
        key = "RenewalDetails"
        var dto = gson.fromJson(lines.toString(), PolicyDTO.Type)
        var policy: Policy
        var renewalDto: RenewalDTO
        try {
          policy = PolicyUtility.getPolicyByPolicyNumber(dto.PolicyNumber)
          isDataFound = true
        } catch (e: PortalException) {
          renewalDto = new RenewalDTO(){
              : IsRenewalFound = false
          }
        }
        if (renewalDto == null)  {

          policy = PolicyUtility.getPolicyByPolicyNumber(dto.PolicyNumber)
          renewalDto = PolicyUtility.getRenewalDetails(policy)
        }

        json = gson.toJson(renewalDto)
      }

      else {
        resp.sendError(404)
      }
    resp.setContentType("application/json")
    if (isDataFound)
      map.put(key, json)
    cache.put("data", map)
    var out: PrintWriter
    out = resp.getWriter()
    out.print(json)
    out.close()    */
  }
}