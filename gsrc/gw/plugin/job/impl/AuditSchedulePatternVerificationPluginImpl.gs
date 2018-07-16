package gw.plugin.job.impl

uses gw.plugin.job.AuditSchedulePatternVerificationPlugin
uses gw.api.productmodel.ProductModelVerificationIssue
uses gw.api.productmodel.AuditSchedulePattern
uses gw.api.productmodel.ProductModelClass
uses gw.api.productmodel.ProductModelField
uses gw.api.productmodel.ProductModelFieldVerificationIssue
uses org.apache.commons.lang.StringUtils
uses java.util.Collection

@Export
class AuditSchedulePatternVerificationPluginImpl implements AuditSchedulePatternVerificationPlugin {

  override function verifyFields(auditSchedulePattern : AuditSchedulePattern, issues: List<ProductModelVerificationIssue>) {
    // For Premium Reporting type patterns, ensure PaymentPlanCode and DefaultDepositPercent are set
    if(auditSchedulePattern.getType() == AuditScheduleType.TC_PREMIUMREPORT) {
      verifyNotEmpty(auditSchedulePattern, AuditSchedulePattern.REPORTING_DEFAULT_DEPOSIT_PCT,
          getEmptyRequiredFieldMessage(AuditSchedulePattern.REPORTING_DEFAULT_DEPOSIT_PCT), issues, gw.api.productmodel.ProductModelVerificationIssue.IssueLevel.ERROR);

      // Add only a warning for this field -- may not be necessary for non-BC billing systems.
      verifyNotEmpty(auditSchedulePattern, AuditSchedulePattern.PAYMENT_PLAN_CODE, getEmptyRequiredFieldMessage(AuditSchedulePattern.PAYMENT_PLAN_CODE), issues, gw.api.productmodel.ProductModelVerificationIssue.IssueLevel.WARNING);
    }
  }

  private function verifyNotEmpty(obj: ProductModelClass, field: ProductModelField, msg: String,
                                  issues: List<ProductModelVerificationIssue>, issueLevel: gw.api.productmodel.ProductModelVerificationIssue.IssueLevel) {
    var o = field.get(obj)
    if (o == null) {
      issues.add(new ProductModelFieldVerificationIssue(issueLevel, obj, field, msg));
    } else if (typeof(o) == String) {
        if (StringUtils.isEmpty(o as String)) {
          issues.add(new ProductModelFieldVerificationIssue(issueLevel, obj, field, msg));
        }
      } else if (typeof(o) == Collection) {
          if ((o as Collection).size() == 0) {
            issues.add(new ProductModelFieldVerificationIssue(issueLevel, obj, field, msg))
          }
      }
  }

  private function getEmptyRequiredFieldMessage(field : ProductModelField) : String {
    return displaykey.ValidationError.ProductModel.EmptyRequiredField(AuditSchedulePattern.Type.Name + "." + field);
  }


}
