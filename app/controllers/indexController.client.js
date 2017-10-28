/*global ajaxFunctions */
'use strict'; 

var appUrl = window.location.origin;
var userLoggedIn = false;
var userUrl = appUrl + '/api/user';
var searchUrl = appUrl + '/api/search';
var attendanceUrl = appUrl + "/api/going";


function addResult(resultData) {
   var newResultElem = document.getElementById("dummyResult").cloneNode(true);
   newResultElem.removeAttribute("id");
   newResultElem.removeAttribute("style");
   newResultElem.setAttribute("data-id",resultData.id);
   var nameElem = newResultElem.getElementsByClassName("resultName")[0];
   nameElem.textContent = resultData.name;
   var statusElem = newResultElem.getElementsByClassName("resultStatus")[0];
   statusElem.textContent = (resultData.is_closed ? "Closed now":"Open now");
   var imageElem = newResultElem.getElementsByClassName("resultImage")[0];
   imageElem.setAttribute("src",resultData.image_url);
   var ratingElem = newResultElem.getElementsByClassName("resultRating")[0];
   addRatingStars(ratingElem, resultData.rating);
   var phoneElem = newResultElem.getElementsByClassName("resultPhone")[0];
   phoneElem.textContent = resultData.display_phone;
   var addressElem = newResultElem.getElementsByClassName("resultAddress")[0];
   addressElem.textContent = resultData.location.address1;
   
   var categoriesElem = newResultElem.getElementsByClassName("resultCategories")[0];
   var categoryStr = "";
   resultData.categories.forEach(function(nextCat){
      categoryStr += (categoryStr == ""?"":", ")+nextCat.alias;
   });
   categoriesElem.textContent = categoryStr;
   
   var attendanceElem = newResultElem.getElementsByClassName("resultAttendance")[0];
   attendanceElem.textContent = resultData.attendees;
   var attendanceToolTip = newResultElem.getElementsByClassName("ttattendance")[0];
   attendanceToolTip.textContent = resultData.attendees+" people are going";
   
   var resultsDiv = document.getElementById("resultsList");
   resultsDiv.appendChild(newResultElem);
   
   var notGoingBtn = newResultElem.getElementsByTagName("button")[0];
   var goingBtn = newResultElem.getElementsByTagName("button")[1];

   if (resultData.going) {
      updateGoingButtons(resultData.id, true);
   }
   
   goingBtn.addEventListener("click", function() {
      if (userLoggedIn) {
         setAttendance(resultData.id, true);
      }
      else {
         var state = getCurrentState();
         state.locationId = resultData.id;
         state.going = true;
         createCookie("location",JSON.stringify(state),1);
         window.location = "/login";
      }
   });
   notGoingBtn.addEventListener("click", function() {
      if (userLoggedIn) {
         setAttendance(resultData.id, false);
      }
      else {
         var state = getCurrentState();
         state.locationId = resultData.id;
         state.going = false;
         createCookie("location",JSON.stringify(state),1);
         window.location = "/login";
      }
   });
}

function addRatingStars(element, ratingNumber) {
   var n,
      fullStar = "star",
      halfStar = "star-half-o",
      emptyStar = "star-o";
   for (n = 1; n <= 5; n++) {
      if (ratingNumber >= n) {
         element.appendChild(getStar(fullStar));
      }
      else if (ratingNumber == (n - 0.5)) {
         element.appendChild(getStar(halfStar));
      }
      else {
         element.appendChild(getStar(emptyStar));
      }
   }
}

function getStar(className) {
   var icon = document.createElement("i");
   icon.setAttribute("class", "fa fa-"+className);
   return icon;
}

function getCurrentState() {
   var locationField = document.getElementsByTagName("input")[0];
   var offsetField = document.getElementsByTagName("input")[1];
         
   var currentState = {
      offset: offsetField.value,
      search: locationField.value
   };
   
   return currentState;
}

function resumeLastUserAction() {
   var lastState = readCookie("location");
   if (lastState) {
      var lastStateObj = JSON.parse(lastState);
      if (lastStateObj) {
         var location = lastStateObj.search;
         var locationField = document.getElementsByTagName("input")[0];
         var offsetField = document.getElementsByTagName("input")[1];
         locationField.value = location;
         offsetField.value = lastStateObj.offset;
         var callback = function() {
            if (lastStateObj.locationId != null) {
              setAttendance(lastStateObj.locationId, lastStateObj.going); 
            }
         };
         if (location == 'Current location') {
            searchCurrentLocation(callback);
         }
         else {
            searchQueryLocation(callback);
         }
      }
   }
   
   eraseCookie("location");
}

function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

function setAttendance(locationId, going) {
   var data = {
      'locationId': locationId,
      'going': going
   };
   
   ajaxFunctions.ajaxPostRequest('POST', attendanceUrl, JSON.stringify(data), function(data) {
      updateGoingButtons(locationId, going);
      updateAttendance(locationId, going);
   });
}

function updateGoingButtons(locationId, going) {
   var locationElem =false;
   var i;
   var results = document.getElementsByClassName("result");
   for (i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.getAttribute("data-id") == locationId) {
         locationElem = r;
         break;
      }
   }
   
   if (locationElem) {
      var goingBtn = locationElem.getElementsByClassName("goingBtn")[0];
      var notGoingBtn = locationElem.getElementsByClassName("notGoingBtn")[0];
      if (going) {
         goingBtn.setAttribute("class", goingBtn.getAttribute("class").replace("inactive","active"));
         notGoingBtn.setAttribute("class", notGoingBtn.getAttribute("class").replace("active","inactive"));
      }
      else {
         goingBtn.setAttribute("class", goingBtn.getAttribute("class").replace("active","inactive"));
         notGoingBtn.setAttribute("class", notGoingBtn.getAttribute("class").replace("inactive","active"));
      }
   }
}

function updateAttendance(locationId, going) {
   var locationElem =false;
   var i;
   var results = document.getElementsByClassName("result");
   for (i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.getAttribute("data-id") == locationId) {
         locationElem = r;
         break;
      }
   }
   
   if (locationElem) {
      var attendanceElem = locationElem.getElementsByClassName("resultAttendance")[0];
      var attendanceToolTip = locationElem.getElementsByClassName("ttattendance")[0];
      var currentAttendance = Number(attendanceElem.textContent);
      if (going) {
         currentAttendance++;
      }
      else {
         currentAttendance = (currentAttendance > 0 ? currentAttendance +1:0);
      }
      
      attendanceElem.textContent = currentAttendance;
      attendanceToolTip.textContent = currentAttendance+" people are going";
   }
}

function displayResults(results) {
   var resultsDiv = document.getElementById("resultsList");
   var dummy = document.getElementById("dummyResult");
   var n;
   while (resultsDiv.firstChild) {
    resultsDiv.removeChild(resultsDiv.lastChild);
   }
   resultsDiv.appendChild(dummy);
   
   var resultObj = JSON.parse(results);
   var messageElem = document.getElementById("statusMessage");
   messageElem.textContent = "No results found";
   if (resultObj) {
      if (resultObj.data && resultObj.data.length > 0) {
         var offsetField = document.getElementsByTagName("input")[1];
         offsetField.value = resultObj.offset;
         var lastResultField = document.getElementsByTagName("input")[2];
         lastResultField.value = resultObj.count;
         
         resultObj.data.forEach(function(result) {
            addResult(result);
         });
         
         messageElem.textContent = "Showing "+resultObj.offset+" - "+(resultObj.offset+10)+" of "+resultObj.count+" results";
         
         if (resultObj.count > 10) {
            var prevBtn = document.getElementById("prevBtn");
            var nextBtn = document.getElementById("nextBtn");
            prevBtn.removeAttribute("style");
            nextBtn.removeAttribute("style");
         }
      }
   }
   
   document.getElementById('results').scrollIntoView();
}

function searchQueryLocation(callback) {
   var locationField = document.getElementsByTagName("input")[0];
      var offsetField = document.getElementsByTagName("input")[1];
      
      if (locationField.value && locationField.value.trim() != "") {
         
         var state = getCurrentState();
         createCookie("location",JSON.stringify(state),1);

         var url = searchUrl + "?location="+encodeURIComponent(locationField.value)+"&offset="+encodeURIComponent(offsetField.value);
   
         ajaxFunctions.ajaxRequest('GET', url, function(data) {
            displayResults(data);
            if (callback) callback();
         });
      }
}

function searchCurrentLocation(callback) {
   var locationField = document.getElementsByTagName("input")[0];
   var offsetField = document.getElementsByTagName("input")[1];
    
   locationField.value = 'Current location';
      
   var url = searchUrl+"?useCurrentLocation=true&offset="+encodeURIComponent(offsetField.value);

   ajaxFunctions.ajaxRequest('GET', url, function(data) {
      displayResults(data);
      if (callback) callback();
   });

}


(function () {

   var searchBtn = document.getElementById('searchBtn');
   //var currentLocationBtn = document.getElementById('currentLocationBtn');
   var previousBtn = document.getElementById('prevBtn');
   var nextBtn = document.getElementById('nextBtn');

   ajaxFunctions.ready(ajaxFunctions.ajaxRequest('GET', userUrl, function(data) {
      var userObj = JSON.parse(data);
      
      var loginBtn = document.getElementById("loginBtn");
      var logoutBtn = document.getElementById("logoutBtn");
      var nameElem = document.getElementById("name");
         
      if (userObj) {
         userLoggedIn = true;
         nameElem.textContent = userObj.name;
         loginBtn.setAttribute("style","display:none;");
         logoutBtn.removeAttribute("style");
      }
      else {
         nameElem.textContent = "";
         logoutBtn.setAttribute("style","display:none;");
         loginBtn.removeAttribute("style");
      }
      
      resumeLastUserAction();
   }));

   searchBtn.addEventListener('click', function(e) {
      e.preventDefault();
      searchQueryLocation();
      }, false);

   /*currentLocationBtn.addEventListener('click', function(e) {
      e.preventDefault();
      searchCurrentLocation();
      
   }, false);*/

   previousBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var locationField = document.getElementsByTagName("input")[0];
      var offsetField = document.getElementsByTagName("input")[1];
      var offset = offsetField.value;
      if (offset > 0) {
         offset -= 10;
         offsetField.value = offset;
         if (locationField.value == 'Current location') {
            searchCurrentLocation();
         }
         else {
            searchQueryLocation();
         }
      }
   }, false);
   
   nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var locationField = document.getElementsByTagName("input")[0];
      var offsetField = document.getElementsByTagName("input")[1];
      var lastResultField = document.getElementsByTagName("input")[2];
      var offset = offsetField.value + 10;
      var lastResulr = lastResultField.value;
      if (offset < lastResulr) {
         offsetField.value = offset;
         if (locationField.value == 'Current Location') {
            searchCurrentLocation();
         }
         else {
            searchQueryLocation();
         }
      }
   }, false);
   
})();
