// Set Let Lon Text
function displayISS(lat, lon) {
    const newLat = document.querySelector("#lat");
    newLat.innerText= `Latitude: ${lat}`;

    // Create long
    const newLong = document.querySelector("#lon");
    newLong.innerText= `Longitude: ${lon}`;
}

// Get Todays Today
function displayDate() {
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;

    return dateTime;
};