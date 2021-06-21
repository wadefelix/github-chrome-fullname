// Saves options to chrome.storage
function save_options() {
  var api= document.getElementById('api').value;
  var jsonpath= document.getElementById('jsonpath').value;
  var apitypes = document.getElementsByName('apitype');
  var header_name = document.getElementById('header_name').value;
  var header_value = document.getElementById('header_value').value;
  var apitype = 'plain';
  for (var i=0; i < apitypes.length; i++) {
    if (apitypes[i].checked) {
      apitype = apitypes[i].value;
    }
  }
  chrome.storage.sync.set({
    api: api,
    apitype: apitype,
    jsonpath: jsonpath,
    header_name: header_name,
    header_value: header_value
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}
      
// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    api: '',
    apitype: 'plain',
    jsonpath: '',
    header_name: '',
    header_value: ''
  }, function(items) {
    document.getElementById('api').value = items.api;
    document.getElementById('jsonpath').value = items.jsonpath;
    document.getElementById('header_name').value = items.header_name;
    document.getElementById('header_value').value = items.header_value;
    var apitypes = document.getElementsByName('apitype');
    for (var i=0; i < apitypes.length; i++) {
      if (apitypes[i].value == items.apitype) {
        apitypes[i].checked = true;
      }
    }
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
