// 1
window.onload = (e) => {document.querySelector("#search").onclick = searchButtonClicked};
	
// 2
let displayTerm = "";

// 3
function searchButtonClicked(){
    console.log("searchButtonClicked() called");
    
    // 1
    const MARVEL_URL = "https://gateway.marvel.com/v1/public/characters?";

    // 2
    // Public API key from here: https://developer.marvel.com/docs/
    let API_KEY = "fedefa1198cc7584d18711f16800dd54";
    let HASH = "00eb4328a410ac808295621f8ff3986a";

    // 3 - Build up our URL string
    let url = MARVEL_URL;

    // 4 - parse the user entered term we wish to search
    let term = document.querySelector("#searchterm").value;
    displayTerm = term;

    // 5 - get rid of any leading and trailing spaces
    term = term.trim();
    
    // 6 - encode spaces and special characters
    term = encodeURIComponent(term);

    // 7 - if there's no term to search then bail out of the function (return does this)
    if(term.length < 1) return;

    // Call for different URLs based on the different search types
    if(!document.querySelector("#searchbybeginswith").checked)
    {
        url += "name=" + term;
        url += "&apikey=" + API_KEY;
        url += "&hash=" + HASH;
        url += "&ts=1";
    }
    else
    {
        url += "nameStartsWith=" + term;
        url += "&apikey=" + API_KEY;
        url += "&hash=" + HASH;
        url += "&ts=1";
    }

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

    // Get the character data
    let result = obj.data;
    console.log(result);
    let charData = result['results'][0];

    // If the character cannot be found show this
    if(charData == null)
    {
        let bigString = "<p><i>Could not find a result for \"" + displayTerm + "\"</i></p>";

        document.querySelector("#content").innerHTML = bigString;
        document.querySelector("#thumbnail").innerHTML = "";
    }
    else
    {
        // If looking for a specific character
        if(!document.querySelector("#searchbybeginswith").checked)
        {
            console.log(charData.name);
            let smallURL = charData.thumbnail.path + ".jpg";
            
            let bigString = "<p><i>Here are the results for \"" + displayTerm + "\"</i></p>";
            let thumbNailString = `<div><img src='${smallURL}' title='${result.id}' /> </div>`

            // If there is no description then change it to none
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

            // Show user
            document.querySelector("#content").innerHTML = bigString;
            document.querySelector("#thumbnail").innerHTML = thumbNailString;

            // Update the status
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
        // Looking through a general search
        else
        {
            let chars = result['results'];
                console.log(chars);
                
                let bigString = `<br><p><i>Here is a list of characters under the search "${displayTerm}"</i></p><br><div id="chars">`;
                for(let i = 0; i < chars.length; i++)
                {
                    let char = chars[i]['name'];


                    let line = `<button>${char}</button>`;

                    bigString += line;

                }
                bigString += "</div>";

                document.querySelector("#content").innerHTML = bigString;
                
        }
    }

    // Iterate through each button to check for clicks
    let buttons = document.querySelectorAll('button');
    for(let i = 0; i < buttons.length; i++)
    {
        // Apply to all buttons except for the search button
        if(buttons[i].innerHTML != "Find Character!")
        {
            // This function basically does the same exact thing as above, 
            // but now uses the name from the button you clicked 
            buttons[i].onclick = function(e)
            {
                document.querySelector("#searchbybeginswith").checked = false;
                
                const MARVEL_URL = "https://gateway.marvel.com/v1/public/characters?";

                let API_KEY = "fedefa1198cc7584d18711f16800dd54";
                let HASH = "00eb4328a410ac808295621f8ff3986a";

                let url = MARVEL_URL;

                let term = buttons[i].innerHTML;
                console.log(term);
                
                displayTerm = term;

                term = term.trim();
                
                term = encodeURIComponent(term);

                if(term.length < 1) return;

                // Call for different URLs based on the different search types
                if(!document.querySelector("#searchbybeginswith").checked)
                {
                    url += "name=" + term;
                    url += "&apikey=" + API_KEY;
                    url += "&hash=" + HASH;
                    url += "&ts=1";
                }
                else
                {
                    url += "nameStartsWith=" + term;
                    url += "&apikey=" + API_KEY;
                    url += "&hash=" + HASH;
                    url += "&ts=1";
                }

                console.log(url);

                getData(url);
                
            }
        }
    }
}

function dataError(e)
{
    console.log("An error occurred");
}