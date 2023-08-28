import API_KEYS from './api.json' assert { type: 'json' };

if (API_KEYS['open-api-key'] == '🤫') alert('Please put your open api key inside ./api.json and restart..');
if (API_KEYS['mongo-key'] == '🤫') alert('Please put your MongoDB api key inside ./api.json and restart..');
if (API_KEYS['cc-key'] == '🤫') alert('Please put your Confluent Cloud Basic auth api key inside ./api.json and restart..');

/*
 Quick Credits where Credits are due:
 This demo was written priarily by (Me) Britton LaRoche Staff Solutions Engineer at Confluent.
 I learned a ton from Orgoro at D-ID using his example live streaming demo
 https://github.com/de-id/live-streaming-demo
 But I learned the most about OPEN AI and Chat GPT by studying this blog and code
 https://www.codeproject.com/Articles/5350454/Chat-GPT-in-JavaScript
 Written by Igor Krupitsky and licnesed under The Code Project Open License (CPOL)
 All we need to do is leave this comment in the code here giving Igor Krupitsky credit and its all good
*/

var OPENAI_API_KEY = `${API_KEYS['open-api-key']}`;
var conversationHistory = new Array();
var bTextToSpeechSupported = false;
var bSpeechInProgress = false;
var oSpeechRecognizer = null
var oSpeechSynthesisUtterance = null;
var lastResponse = {};
var oVoices = null;

const loadUserProfileButton = document.getElementById('load-profile-button');
loadUserProfileButton.onclick = async () => {
    // To go around the body onload event not being in a module
    // this button is clicked by init function in body onload event of index.html
    // It can also be called by clicking the "load User data" button
    // so we clear the conversation history and start over.
    txtOutput.value = "";
    conversationHistory = new Array();
    conversationHistory.push({"role":"system","content":"You are a digital assistant and your name is Jayne Kafcongo."});
    if ("webkitSpeechRecognition" in window) {
    } else {
        //speech to text not supported
        lblSpeak.style.display = "none";
    }
    var txt = "";
    var response = "";
    var userEmail = JSON.stringify(document.getElementById("user-email").value);
    var myString = "{\"dataSource\": \"Kafcongo-Demo\",\"database\": \"Sales\",\"collection\": \"UserProfile\",\"filter\": {\"email\":  " + userEmail +"}}";
    console.log(myString);
    var inputDoc = JSON.parse(myString);
    var myBody = JSON.stringify(inputDoc);
    //Check to see if we have an input document or not
    response = await fetch("http://localhost:3000/v1/action/findOne", {
      method: 'POST',
      body: myBody, // string or object
      headers:  { 
                "Content-Type":"application/json",
                "api-key": `${API_KEYS['mongo-key']}`
          }
    });
    console.log(response);
    const myJson = await response.json(); //extract JSON from the http response
    console.log(myJson);
    var userProfile = JSON.stringify(myJson, undefined, 2);
    conversationHistory.push({"role":"system","content":"The user you are speaing to has the following profile information: " + userProfile});
};

const sendTopicButton = document.getElementById('send-topic-button');
sendTopicButton.onclick = async () => {
  //Show the about video
  await sendToTopic();
};

const sendToTopic = async () => {
    var txt = "";
    var response = "";
    var inputDoc = JSON.parse(document.getElementById("input_json").value);
    var myBody = JSON.stringify(inputDoc);

    //Check to see if we have an input document or not
    console.log(myBody);
    response = await fetch("http://localhost:3000/records", {
      method: 'POST',
      body: myBody, // string or object
      headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${API_KEYS['cc-key']}` 
        }
    });
    console.log(response.toString());
    const myJson = await response.json(); //extract JSON from the http response
    console.log(myJson);
    document.getElementById("results").innerHTML = JSON.stringify(myJson, undefined, 2);
  };

function ChangeLang(o) {
    if (oSpeechRecognizer) {
        oSpeechRecognizer.lang = selLang.value;
        //SpeechToText()
    }
}

const sendOpenAIButton = document.getElementById('send-openai-button');
sendOpenAIButton.onclick = async () => {
  //Show the about video
  await SendToOpenAI();
};

function SendToOpenAI() {

    if (chkMute.checked){
        return;
    }

    var sQuestion = txtMsg.value;
    if (sQuestion == "") {
        alert("Type in your question!");
        txtMsg.focus();
        return;
    }

    spMsg.innerHTML = "Chat GPT is thinking...";

    var sUrl = "https://api.openai.com/v1/completions";
    var sModel = selModel.value;// "text-davinci-003";
    if (sModel.indexOf("gpt-4") != -1 ) {
        //https://openai.com/research/gpt-4
        sUrl = "https://api.openai.com/v1/chat/completions";
    }

    var oHttp = new XMLHttpRequest();
    console.log(sUrl);
    oHttp.open("POST", sUrl);
    oHttp.setRequestHeader("Accept", "application/json");
    oHttp.setRequestHeader("Content-Type", "application/json");
    oHttp.setRequestHeader("Authorization", "Bearer " + OPENAI_API_KEY)

    oHttp.onreadystatechange = function () {
        if (oHttp.readyState === 4) {
            //console.log(oHttp.status);

            spMsg.innerHTML = "";

            var oJson = {}
            if (txtOutput.value != "") txtOutput.value += "\n";

            try {
                oJson = JSON.parse(oHttp.responseText);
            } catch (ex) {
                txtOutput.value += "Error: " + ex.message
            }

            if (oJson.error && oJson.error.message) {
                txtOutput.value += "Error: " + oJson.error.message;

            } else if (oJson.choices) {
                var s = "";

                if (oJson.choices[0].text) {
                    s = oJson.choices[0].text;

                } else if (oJson.choices[0].message) {
                    //GPT-4
                    s = oJson.choices[0].message.content;
                }

                if (selLang.value != "en-US") {
                    var a = s.split("?\n");
                    if (a.length == 2) {
                        s = a[1];
                    }
                }

                if (s == "") {
                    s = "No response";
                } else {
                    var shortRepsonse = s.substring(0,300);
                    if (s.length >= 300) {
                        shortRepsonse = shortRepsonse + " ... My Voice response is limited by time. Read the text for my full response";
                    }
                    txtResponse.value = shortRepsonse;
                    txtOutput.value += "assistant: " + s +"\n";
                    txtOutput.scrollTop = txtOutput.scrollHeight;
                    lastResponse = {"role":"assistant", "content" : s};
                    conversationHistory.push(lastResponse);
                    document.getElementById("talk-button").click();
                }
            }
        }
    };

    var iMaxTokens = 2048;
    var sUserId = "1";
    var dTemperature = 0.5;

    var data = {
        model: sModel,
        prompt: sQuestion,
        max_tokens: iMaxTokens,
        user: sUserId,
        temperature: dTemperature,
        frequency_penalty: 0.0, //Number between -2.0 and 2.0  
                                //Positive value decrease the model's likelihood 
                                //to repeat the same line verbatim.
        presence_penalty: 0.0,  //Number between -2.0 and 2.0. 
                                //Positive values increase the model's likelihood 
                                //to talk about new topics.
        stop: ["#", ";"]        //Up to 4 sequences where the API will stop generating 
                                //further tokens. The returned text will not contain 
                                //the stop sequence.
    }

    //chat GPT-4 gpt-4
    if (sModel.indexOf("gpt-4") != -1) {
        //lets keep context
        conversationHistory.push({
            "role": "user", //system,user,assistant
            "content": sQuestion
        });
        //conversationHistoryCopy = JSON.parse(JSON.stringify(conversationHistory));
        data = {
            "model": sModel,
            "messages": conversationHistory
        }
        //console.log(data);
    }

    oHttp.send(JSON.stringify(data));

    if (txtOutput.value != "") txtOutput.value += "\n";
    txtOutput.value += "user: " + sQuestion;
    txtOutput.scrollTop = txtOutput.scrollHeight;
    txtMsg.value = "";
}

const speechToText = document.getElementById('chkSpeakToText');
speechToText.onclick = async () => {

    if (chkMute.checked){
        return;
    }
    if (oSpeechRecognizer) {

        if (speechToText.checked) {
            oSpeechRecognizer.start();
        } else {
            oSpeechRecognizer.stop();
            return;
        }

        return;
    }    

    oSpeechRecognizer = new webkitSpeechRecognition();
    oSpeechRecognizer.continuous = true;
    oSpeechRecognizer.interimResults = true;
    oSpeechRecognizer.lang = selLang.value;
    oSpeechRecognizer.start();

    oSpeechRecognizer.onresult = function (event) {
        var interimTranscripts = "";
        for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                txtMsg.value = transcript;
                SendToOpenAI();
            } else {
                transcript.replace("\n", "<br>");
                interimTranscripts += transcript;
            }

            var oDiv = document.getElementById("idText");
            oDiv.innerHTML = '<span style="color: #999;">' + 
                               interimTranscripts + '</span>';
        }
    };

    oSpeechRecognizer.onerror = function (event) {

    };
}