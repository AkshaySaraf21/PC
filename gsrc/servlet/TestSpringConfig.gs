package servlet

uses org.springframework.context.annotation.Configuration
uses org.springframework.web.servlet.config.annotation.EnableWebMvc
uses org.springframework.context.annotation.ComponentScan

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 7/5/18
 * Time: 6:06 PM
 * To change this template use File | Settings | File Templates.
 */
@Configuration
@EnableWebMvc
@ComponentScan (:basePackages ={"servlet.webservice"})
class TestSpringConfig {

}