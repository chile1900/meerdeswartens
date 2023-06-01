$('.myButton').click(function(){
  $('div[id^=create]').hide(); //hide all
  var id = $(this).attr('id'); //get the id of the clicked button
  var end = id.slice(-2);      //get last 2 character (LD/VC/FD) from id
  $(`div[id$=${end}]`).show(); //match the div with id ends with the character and show
});
