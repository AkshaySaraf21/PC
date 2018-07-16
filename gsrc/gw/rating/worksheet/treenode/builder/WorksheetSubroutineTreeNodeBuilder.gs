package gw.rating.worksheet.treenode.builder

uses gw.rating.worksheet.domain.WorksheetSubroutine
uses gw.rating.worksheet.treenode.IWorksheetTreeNode
uses gw.rating.worksheet.treenode.WorksheetTreeNodeLeaf
uses java.lang.StringBuilder

@Export
class WorksheetSubroutineTreeNodeBuilder extends WorksheetTreeNodeBuilder<WorksheetSubroutine> {
  
  override function build(entry : WorksheetSubroutine) : List<IWorksheetTreeNode> {
    var results : List<IWorksheetTreeNode> = {}
    if (entry.Type == "void") { //for void functions
      var operandBuilder = new StringBuilder()
      var valueBuilder = new StringBuilder()
      WorksheetPopulatorUtil.populate(entry, operandBuilder, valueBuilder, true)
      var node = new WorksheetTreeNodeLeaf()
      node.Instruction = operandBuilder.toString()
      node.OperandValue = valueBuilder.toString()
      results.add(node)
    }
    return results
  }
}
