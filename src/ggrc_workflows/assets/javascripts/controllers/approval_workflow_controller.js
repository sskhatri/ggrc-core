/*!
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

;(function(can, $, GGRC, CMS) {
GGRC.register_modal_hook("approvalform", function($target, $trigger, option) {
  var instance,
      object_params = JSON.parse($trigger.attr('data-object-params') || "{}");

  if($trigger.attr('data-object-id') === "page") {
    instance = GGRC.page_instance();
  } else {
    instance = CMS.Models.get_instance(
      $trigger.data('object-singular'),
      $trigger.attr('data-object-id')
    );
  }

  $target
    .modal_form(option, $trigger)
    .ggrc_controllers_approval_workflow({
      object_params : object_params,
      current_user : GGRC.current_user,
      instance : instance
    });
});

})(window.can, window.can.$, window.GGRC, window.CMS);


//Calendar authentication

jQuery(function($){
  $('body').on('click', '.calendar-auth', function(e) {
    var calenderAuthWin = null,
      href = window.location.origin + "/calendar_oauth_request", //"https://ggrc-dev.googleplex.com/calendar_oauth_request"
      name = "Calendar Authentication";

    if(calenderAuthWin === null || calenderAuthWin.closed){
      calenderAuthWin = window.open(href, name);
      calenderAuthWin.focus();
    }
    else{
      calenderAuthWin.focus();
    }
  });
});
