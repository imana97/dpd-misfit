# dpd-misfit
misfit cloud api for deployd

# quick setup

1. npm install dpd-misfit
2. run deployd
3. In the dashboard create a resource "Misfit"
4. In the resource config, add the appKey, appSecret obtained from https://build.misfit.com/apps
5. In the resource config, add the redirect url, exactly as the url of the resource, for example if the resource name is misfit and you are under dev, then its probably "http://localhost:2403/mistfit"
6. In the events, on get event, you can get the access token for each user like this and store it somewhere
for example: 

	    //on get
		cancelUnless(me,'you need to login first',401);
		dpd.users.put(me.id,{misfitToken:misfitToken.access_token},function(res,err){
	    setResult(res,err);
		});

7. In the events, on Post event, you can fetch the userProfile info or getSummary if you set the event like this.

		//on Post
		cancelUnless(me,'you are not authorized',401);
		if (me.misfitToken===""){
		    cancel('you dont have any misfit token');
		}

		body.token=me.misfitToken;
		if (body.userProfile){
		    getProfile(body.token,function(res){
		        setResult(res);
		    });
		} else {
		    getSummary(body,function(res){
		    setResult(res);
		});
		}

8. on the clinet side, or dpd you can do like this:
	9. a. to get the user profile:
	
			dpd.mistfit.post({userProfile:true},function(res,err){console.log(res,err)});

	10. to get the user activity summary
	
			dpd.mistfit.post({startDate:"2014-08-18",endDate:"2014-08-19",detail:true},function(res,err){console.log(res,err)});


-iman


