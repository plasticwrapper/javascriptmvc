//we probably have to have this only describing where the tests are
steal
 .apps("jquery/view","jquery/view/micro","jquery/view/ejs","jquery/view/jaml")  //load your app
 .plugins('funcunit/qunit')  //load qunit
 .then("view_test")
 
if(steal.browser.rhino){
  steal.plugins('funcunit/qunit/env')
}