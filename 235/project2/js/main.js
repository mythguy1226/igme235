// 1
window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};
	
// 2
let displayTerm = "";

// 3
function searchButtonClicked(){
    console.log("searchButtonClicked() called");
    
    // 1
    const GIPHY_URL = "https://gateway.marvel.com/v1/public/characters?";

    // 2
    // Public API key from here: https://developers/giphy.com/docs/
    // If this one no longer works, get your own (it's free!)
    let API_KEY = "fedefa1198cc7584d18711f16800dd54";
    let HASH = "00eb4328a410ac808295621f8ff3986a";

    // 3 - Build up our URL string
    let url = GIPHY_URL;

    // 4 - parse the user entered term we wish to search
    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    // 5 - get rid of any leading and trailing spaces
    term = term.trim();
    
    // 6 - encode spaces and special characters
    term = encodeURIComponent(term);

    // 7 - if there's no term to search then bail out of the function (return does this)
    if(term.length < 1) return;

    // 8 - append the search term to the URL - the parameter name is 'q'
    url += "name=" + term;
    url += "&apikey=" + API_KEY;
    url += "&hash=" + HASH;
    url += "&ts=1";

    // 10 - update the UI
    //document.querySelector("#status").innerHTML = `<iframe src="https://giphy.com/embed/9rjHo7vXhB9F5by3Wg" width="480" height="270" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/digitaldjtips-stan-lee-amazing-spider-man-library-dj-9rjHo7vXhB9F5by3Wg">via GIPHY</a></p>`;

    // 11 - see what the URL looks like
    console.log(url);

    // 12 Request Data!
    getData(url);
}

function getData(url)
{
    // 1 - Create a new XHR Object
    let xhr = new XMLHttpRequest();

    // 2 - set the onload handler
    xhr.onload = dataLoaded;
    // 3 - set the onerror handler
    xhr.onerror = dataError;

    // 4 - open connection and send the request
    xhr.open("GET", url);
    xhr.send();
}

// Callback functions
function dataLoaded(e)
{
    // 5 - event.target is the xhr object
    let xhr = e.target;

    // 6 - xhr.responseText is the JSON file we just downloaded
    console.log(xhr.responseText);

    // 7 - turn the text into a parsable Javascript Object
    let obj = JSON.parse(xhr.responseText);

    // 8 - if there are no results, print the message and return
    if(!obj.data || obj.data.length == 0)
    {
        document.querySelector("#status").innerHTML = "<b>No results found for '" + displayTerm + "'</b>";
        return; // Bail out
    }

    // 9 - start building an HTML string we will display to the user
    let result = obj.data;
    console.log(result);
    let charData = result['results'][0];

    if(charData == null)
    {
        let bigString = "<p><i>Could not find a result for \"" + displayTerm + "\"</i></p>";

        document.querySelector("#content").innerHTML = bigString;
        document.querySelector("#thumbnail").innerHTML = "";
    }
    else
    {
        if(!document.querySelector("#searchbybeginswith").checked)
        {
            console.log(charData.name);
            let smallURL = charData.thumbnail.path + ".jpg";
            
            let bigString = "<p><i>Here are the results for \"" + displayTerm + "\"</i></p>";
            let thumbNailString = `<div><img src='${smallURL}' title='${result.id}' /> </div>`

            // 11 - get the URL to the GIF
            
            
            // 13 - Build a <div> to hold each result
            // ES6 String Templating
            if(charData.description != "")
            {
                let line = `<div><p>Description: ${charData.description}</p></div>`;
                bigString += line;
            }
            else
            {
                let line = `<div><p>Description: None</p></div>`;
                bigString += line;
            }

            // 16 - all done building the HTML - show it to the user!
            document.querySelector("#content").innerHTML = bigString;
            document.querySelector("#thumbnail").innerHTML = thumbNailString;

            // 17 - update the status
            document.querySelector("#status").innerHTML = "<b>Success!</b>";

            // Add any comics the character was in
            if(document.querySelector("#comicsfilter").checked)
            {
                let comics = charData['comics']['items'];
                console.log(comics);
                let bigString = `<p><i>Here is a list of comics for "${displayTerm}"</i></p><br><div id="comics">`;
                for(let i = 0; i < comics.length; i++)
                {
                    let comic = comics[i]['name'];


                    let line = `<p>${comic}</p>`;
                    
                    bigString += line;

                }
                bigString += "</div>";

                document.querySelector("#content").innerHTML += bigString;
            }

            // Add any events the character was in
            if(document.querySelector("#eventsfilter").checked)
            {
                let events = charData['events']['items'];
                console.log(events);
                let bigString = `<br><p><i>Here is a list of events for "${displayTerm}"</i></p><br><div id="events">`;
                for(let i = 0; i < events.length; i++)
                {
                    let event = events[i]['name'];


                    let line = `<p>${event}</p>`;

                    bigString += line;

                }
                bigString += "</div>";

                document.querySelector("#content").innerHTML += bigString;
            }
        }
    }
}

function dataError(e)
{
    console.log("An error occurred");
}