import urllib.request
import json

# Replace these
userid='<Your-User-ID>'  
password='<Your-Password>'

loginBody = { "UserID": userid, "Password": password }
loginURL = "https://apigw-prod.api.triva.xyz/mobile-methods/login/Login"

req = urllib.request.Request(loginURL)
req.add_header('Content-Type', 'application/json; charset=utf-8')
jsondata = json.dumps(loginBody)
jsondataasbytes = jsondata.encode('utf-8')   # needs to be bytes
req.add_header('Content-Length', len(jsondataasbytes))
response = urllib.request.urlopen(req, jsondataasbytes)

rslt = json.loads(response.read().decode());

# This is the ID token - it's good for 60 minutes, but can be renewed using the login/RenewLogin API and the refresh token
idToken = rslt['IDToken']
refreshToken = rslt['RefreshToken']

# Starting from zero - this would normally be remembered to avoid reloading all data from scratch
clientVersion = 0

# From here, just use the ID token as an authorization token
done = False
offset = 0
clientids = []
while (not done):
    clientURL = "https://apigw-prod.api.triva.xyz/DataPublish/Clients/sinceVersion/{}?offset={}&limit=100".format(clientVersion, offset)
    req = urllib.request.Request(clientURL)
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    req.add_header('Authorization', 'Bearer ' + idToken)
    response = urllib.request.urlopen(req)
    rslt = json.loads(response.read().decode());

    for cli in rslt["clientUpdates"]:
        print("client: " + json.dumps(cli))
        clientids.append(cli['clientID'])

    if (rslt["moreUpdates"] == False):
        done = True
        clientVersion = rslt["finalVersion"]   # New version to start with during next refresh
    else:
        offset = offset + rslt["clientUpdates"].Length

for clientID in clientids:
    done = False
    projectids = []
    offset = 0
    projectVersionForClient = 0 # This would also be stored - one value for each client
    projectURL = "https://apigw-prod.api.triva.xyz/DataPublish/Projects/{}/sinceVersion/{}?offset={}&limit=100".format(clientID, projectVersionForClient, offset)
    req = urllib.request.Request(projectURL)
    req.add_header('Content-Type', 'application/json; charset=utf-8')
    req.add_header('Authorization', 'Bearer ' + idToken)
    response = urllib.request.urlopen(req)
    rslt = json.loads(response.read().decode());

    for proj in rslt["projectUpdates"]:
        print("project: " + json.dumps(proj))
        projectids.append(proj['projectID'])

    if (rslt["moreUpdates"] == False):
        done = True
        projectVersionForClient = rslt["finalVersion"]   # New version to start with during next refresh
    else:
        offset = offset + rslt["projectUpdates"].Length


