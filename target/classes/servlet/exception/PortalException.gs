package servlet.exception

uses java.lang.Exception

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/20/18
 * Time: 3:22 PM
 * To change this template use File | Settings | File Templates.
 */
class PortalException extends Exception {
  construct(message: String) {
    super(message)
  }
}