// Some DataSets are massive and will bring any web browser to its knees if you
// try to load the entire thing. To keep your app performing optimally, take
// advantage of filtering, aggregations, and group by's to bring down just the
// data your app needs. Do not include all columns in your data mapping file,
// just the ones you need.
//
// For additional documentation on how you can query your data, please refer to
// https://developer.domo.com/docs/dev-studio/dev-studio-data

// DDX Bricks Wiki - See https://developer.domo.com/docs/ddx-bricks/getting-started-using-ddx-bricks
// for tips on getting started, linking to Domo data and debugging your app

//Available globals
var domo = window.domo; // For more on domo.js: https://developer.domo.com/docs/dev-studio-guides/domo-js#domo.get
var datasets = window.datasets;
var currentReportId = '';

//Step 1. Select your dataset(s) from the button in the bottom left corner



//Step 2. Query your dataset(s): https://developer.domo.com/docs/dev-studio-references/data-api
var fields = ['User Email', 'Report', 'Frequency', 'Day to Run', 'Hour', 'Minute', 'Id', 'Enabled'];
domo.get('/data/v2/emailSubscriptions?limit=100&orderby=Id ascending').then(handleResult).then(setDropdown);



//Step 3. Do something with the data from the query result
function handleResult(data) {
  for (var i = 0; i < data.length; i++) {
    // console.log(data[i]);
    var tableHTML = '<tr>';
    if (data[i]['Enabled'] == 'true') {
      tableHTML += '<td class="collapsing">' +
        '<div id="enabled-' + data[i]['Id'] + '" class="ui fitted toggle checked checkbox">' +
        '<input id="check-' + data[i]['Id'] + '" type="checkbox" checked="checked"> <label></label>' +
        '</div>' +
        '</td>';
    } else {
      tableHTML += '<td>' +
        '<div id="enabled-' + data[i]['Id'] + '" class="ui fitted toggle checkbox">' +
        '<input type="checkbox"> <label></label>' +
        '</div>' +
        '</td>';
    }
    tableHTML += '<td>' + data[i]['Report'] + '</td>';
    tableHTML += '<td><div class="ui input"><input id="subject-' + data[i]['Id'] + '" type="text" value="' + data[i]['Subject'] + '"></div></td>'



    // Build out the email column

    tableHTML += '<td><div id="user-' + data[i]['Id'] + '"><div class="ui label email-address">' + data[i]['User Email'] + '<i class="delete icon email-delete"></i></div>';

    if (data[i + 1] !== undefined) {
      var e = i;
      try {
      while (data[e]['Id'] == data[e + 1]['Id']) {
        tableHTML += '<div class="ui label email-address">' + data[e + 1]['User Email'] + '<i class="delete icon email-delete"></i></div>';
        e++;
      }
    } catch (error){
      console.log('reached the end of the list');
    }
      i = e;
    }
    tableHTML += '</div><div class="ui right floated"><button id="add-user-' + data[i]['Id'] + '" class="mini ui icon button">' +
      '<i class="plus icon"></i>ADD' +
      '</button></div></td>';
    tableHTML += '<td>' + data[i]['Frequency'] + '</td>'
    tableHTML += '<td><select id="day-' + data[i]['Id'] + '" name="dayofweek" multiple="" class="ui fluid dropdown column-fit-wide">' +
      '<option value="0">Sunday</option>' +
      '<option value="1">Monday</option>' +
      '<option value="2">Tuesday</option>' +
      '<option value="3">Wednesday</option>' +
      '<option value="4">Thursday</option>' +
      '<option value="5">Friday</option>' +
      '<option value="6">Saturday</option>' +
      '</select></td>' +
      "<script>$('.ui.dropdown').dropdown();</script>";

    tableHTML += '<td><div class="ui input column-fit-narrow"><input id="hour-' + data[i]['Id'] + '" type="text" value="' + data[i]['Hour'] + '"></div></td>'
    tableHTML += '<td><div class="ui input column-fit-narrow"><input id="minute-' + data[i]['Id'] + '" type="text" value="' + data[i]['Minute'] + '"></div></td>'
    tableHTML += '<td>' + '<button id="' + data[i]['Id'] + '"class="ui orange button save-row">SAVE</button>' + '</td>'
    tableHTML += '</tr>'
    document.getElementById('table-body').innerHTML += tableHTML;
    $('.ui.checkbox').checkbox();
  }
  $('.save-row').on('click', function () {
    console.log('button clicked: ' + this.id);
    // $(this).addClass('loading');
    var rowId = this.id;
    var enabledValue = $('#check-' + rowId).prop('checked');
    var subjectValue = $('#subject-' + rowId).val();
    var hourValue = $('#hour-' + rowId).val();
    var minuteValue = $('#minute-' + rowId).val();
    var dayValue = $('#day-' + rowId).dropdown('get value');
    var emails = [];
    $('#user-' + rowId).children().each(function(e){
      console.log($(this).text());
      if ($(this).hasClass('add')){
        console.log('an email address was added');
        emails.push({
          'action' : 'add',
          'type' : 'EMAIL',
          'value': $(this).text(),})
      } else if ($(this).hasClass('remove')){
        console.log('an email address was removed');
        emails.push({
          'action' : 'remove',
          'type' : 'EMAIL',
          'value': $(this).text(),})
      }
    });

    // console.log(emails);
    // console.log('enabledValue: ' + enabledValue);
    // console.log('dayValue: ' + dayValue);
    // console.log('hourValue: ' + hourValue);
    // console.log('minuteValue: ' + minuteValue);

    var jsonPackage = {
      "enabled": enabledValue,
      "title": subjectValue,
      "frequency": "WEEKLY",
      "daysToRun": dayValue.join(','),
      "hourOfDay": hourValue,
      "minOfHour": minuteValue,
      "recipients": emails
    };

    // console.log(jsonPackage);

    startWorkflow("updateScheduledReports", { "id": parseInt(rowId), "updatedFields": jsonPackage });
    // startWorkflow("manageScheduledReports", { "id": parseInt(rowId)});

  });

  $('[id^=add-user]').on('click', function () {
    console.log('add user clicked... ' + this.id);
    currentReportId = this.id.replace('add-user-', '');
    var inputHTML = '<form class="ui form">';

    inputHTML += '<div class="field"><label>Email Address</label>' +
      '<input name="email" id="input-' + this.id + '"type="text" placeholder="Email address...">' +
      '</div>';
    inputHTML += '<div class="ui submit button user-add-save">Submit</div>' +
      '<div class="ui error message"></div>' +
      '</form>';

    $('.modal-content').html(inputHTML);
    $('.ui.form').form({
      on: 'blur',
      fields: {
        email: {
          identifier: 'email',
          rules: [
            {
              type: 'email',
              prompt: 'Please enter a valid e-mail'
            }
          ]
        }
      },
      onSuccess: function (event, fields) {
        event.preventDefault();
        console.log(fields);
        console.log($('[id^=input-add-user]').val());
        // var emailAdd = $('[id^=input-add-user]').val();
        var emailAdd = fields.email;
        var userHTML = '<div class="ui label email-address add">' + emailAdd + '<i class="delete icon email-delete-added"></i></div>';
        $('#user-' + currentReportId).append(userHTML);
        var userHTML = '';
        $('.email-delete-added').on('click', function (e) {
          $(this).parent().addClass('remove');
          console.log('Trying to delete?');
        });
        $('.ui.modal').modal('hide');
      }
    });

    $('.ui.modal').modal('show');
  });

  $('.email-delete').on('click', function () {
    $(this).parent().addClass('remove');
    console.log('Trying to delete?');
  });

  return data;
}

function setDropdown(data) {
  for (var i = 0; i < data.length; i++) {
    $('#day-' + data[i]['Id']).dropdown('set exactly', data[i]['Day to Run'].split(','));

  }
}

const startWorkflow = (alias, body) => {
  domo.post(`/domo/workflow/v1/models/${alias}/start`, body).then(function(result){
    console.log(result);
  });
};
