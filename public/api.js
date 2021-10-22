// Set Let Lon Text
function displayISS(lat, lon) {
    const newLat = document.querySelector("#lon");
    newLat.innerText= `Latitude: ${lat}`;

    // Create long
    const newLong = document.querySelector("#lat");
    newLong.innerText= `Longitude: ${lon}`;
}