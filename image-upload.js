/**
@todo
- theme / style (remove existing styles and make it more barebones)
- do crop (without this, this directive isn't much more useful than a more generic (multi)file upload directive)
	- do crop without jQuery/jCrop??
- test (unit tests & manually w/ backend)
	- do / test upload by url and other options & combinations
	
@toc
//1. function checkFileType
//2. function getFileExtension
//3. $scope.fileSelected =function
//4. $scope.uploadFile =function
//5. function uploadProgress
//6. function uploadComplete
//6.25. function ajaxUploadComplete
//6.5. function afterComplete
//7. function uploadFailed
//8. function uploadCanceled

@param {Object} scope (attrs that must be defined on the scope (i.e. in the controller) - they can't just be defined in the partial html). REMEMBER: use snake-case when setting these on the partial!
	@param {String} ngModel Variable for storing the file name of the uploaded file
	@param {Object} opts
		@param {String} uploadPath Path to upload file to (backend script)
		@param {String} uploadDirectory Directory to store file in - NOTE: this must be relative to the ROOT of the server!!
		@param {Object} imageServerKeys Items that tell what keys hold the following info after returned from backend
			@param {String} imgFileName Key for variable that holds image file name / partial path ONLY (not the full path; uploadDirectory variable will be prepended). This can have a folder as part of it - i.e. 'image1.jpg' OR 'original/image1.jpg'
			@param {Number} picHeight
			@param {Number} picWidth
			@param {String} imgFileNameCrop Key for variable that holds the file name of the newly cropped image. This can also have a folder in front of it - i.e. '200/image1.jpg'
		@param {Object} [serverParamNames] Form names to submit (so can interact with any server). Note, additional information will be passed back in "fileData" object and "cropOptions" object
			@param {String} [file ='file']
			@param {String} [byUrl ='fileData[fileUrl]']
		@param {String} [uploadCropPath] (required for cropping) Path to handle the cropping (backend script)
		@param {Object} [values]
			@param {String} dirPath Path where image is (to show a default / initial value image the ngModel value will be appended to this path (if these both exist))
			@param {String} src Filename (i.e. image.jpg)
		@param {Array} [fileTypes] 1D array [] of valid file types (i.e. ['png', 'jpg', 'jpeg', 'bmp', 'gif'])
		@param {Object} cropOptions Items with defaults for cropping
			@param {Boolean} [crop =true] True to allow cropping
			@param {Number} [cropAspectRatio =1] Number to indicate how to crop, 1 = square, 2 = twice as wide as tall, .5 =twice as tall as wide
			@param {Number} [cropMinHeight =100] Minimum pixel height for cropped version
			@param {Number} [cropMinWidth =100] Minimum pixel width for cropped version
			@param {Number} [cropMaxHeight =300] Max pixel height for cropped version
			@param {Number} [cropMaxWidth =300] Max pixel width for cropped version
			@param {String} [cropDuplicateSuffix ="_crop"] Suffix to add to image for the cropped version
		@param {Object} callbackInfo
			@param {String} evtName Angular event name to broadcast
			@param {Array} args Function arguments ('data' will be appended as additional argument to end)
		//standardAjaxForUrl =boolean true if want to use jquery/standard ajax for submitting url as opposed to form data

@param {Object} attrs REMEMBER: use snake-case when setting these on the partial! i.e. my-attr='1' NOT myAttr='1'
	@param {Number} [useUploadButton=0] True if want to show an upload button for confirming the upload (otherwise, as soon as picture is selected, it will be uploaded & shown for a preview)
	@param {String} [type =dragNDrop] What type of user interface - one of: 'dragNDrop', 'byUrl' (to paste a link from another website)
	@param {String} [htmlDisplay] Complete html for what to put in drag box
	@param {String} [htmlUrlInstructions] Complete html for what to put below upload by url input field
	@param {String} [htmlUploading] Html to display during upload INSTEAD of upload progress bar (i.e. in case backend is doing more than just uploading the image (heavy image process that takes many seconds) in which case the progress bar will only show the upload progress but backend may not be done yet..)


@usage
partial / html:
<div jrg-image-upload opts='uploadOpts' ng-model='image'></div>

controller / js:
$scope.image ='';
//NOTE: the $scope.$on evt is optional since using ngModel will automatically update this $scope value accordingly
var evtImageUpload ='TestCtrlImageUpload';
$scope.uploadOpts =
{
	//'type':'byUrl',
	'uploadPath':'/imageUpload',
	'uploadDirectory':'/uploads',
	'serverParamNames': {
		'file': 'myFile'
	},
	// 'uploadCropPath':'/api/image/crop',
	// 'callbackInfo':{'evtName':evtImageUpload, 'args':[{'var1':'yes'}]},
	'imageServerKeys':{'imgFileName':'fileNameSave', 'picHeight':'picHeight', 'picWidth':'picWidth', 'imgFileNameCrop':'newFileName'},		//hardcoded must match: server return data keys
	//'htmlDisplay':"<div class='ig-form-pic-upload'><div class='ig-form-pic-upload-button'>Select Photo</div></div>",
	// 'cropOptions': {'crop':true, 'cropMaxHeight':500, 'cropMaxWidth':500}
	'cropOptions': {'crop':false}
	//'values':{'dirPath':'/uploads'}
};

//OPTIONAL
$scope.$on(evtImageUpload, function(evt, args) {
	//do extra post upload handling here..
	//$scope.formVals.image =args[1].imgFileName;
});


BACKEND (required to actually accept the file - note it's just like a standard input type='file' upload - the file data will be POSTed to the backend along with some other parameters. You basically need to do the following:
1. copy the uploaded file (to a final location)
	1. this may require creating a new directory for the image(s) if the directory doesn't already exist. Also choosing a file name for the new image if you don't want to use the existing name of the uploaded image.
2. pass back the name of the file as a key defined in $scope.opts.imageServerKeys.imgFileName

node.js example (though works with ANY backend / language - adapt to whatever you're using)
app.post('/imageUpload', function(req, res) {
	var ret ={
		files: req.files,		//node.js puts files in the req.files object - this is an array of all files uploaded
		reqBody: req.body		//rest of post data is here
	};
	
	var dirPath =__dirname + "/"+req.body.fileData.uploadDir;		//use post data 'uploadDir' parameter to set the directory to upload this image file to
	//make uploads directory if it doesn't exist
	var exists =fs.existsSync(dirPath);
	if(!exists) {
		fs.mkdirSync(dirPath);
	}
	
	var fileInputName ='myFile';		//hardcoded - must match what's set for serverParamNames.file in image-upload directive (defaults to 'file')
	var imageFileName =req.files[fileInputName].name;		//just keep the file name the same as the name that was uploaded - NOTE: it's probably best to change to avoid bad characters, etc.
	ret.fileNameSave =imageFileName;		//hardcoded 'fileNameSave' must match what's set in imageServerKeys.imgFileName value for image-upload directive. THIS MUST BE PASSED BACK SO WE CAN SET NG-MODEL ON THE FRONTEND AND DISPLAY THE IMAGE!
	
	//copy (read and then write) the file to the uploads directory. Then return json.
	fs.readFile(req.files[fileInputName].path, function (err, data) {
		var newPath = dirPath +"/"+imageFileName;
		fs.writeFile(newPath, data, function (err) {
			// res.redirect("back");
			res.json(ret);
		});
	});
});

//end: usage
*/

'use strict';

angular.module('jackrabbitsgroup.angular-image-upload', []).directive('jrgImageUpload', ['$timeout', 'jrgImageUploadData', function ($timeout, jrgImageUploadData) {

	return {
		restrict: 'A',
		scope: {
			opts:'=',
			ngModel:'='
		},

		compile: function(element, attrs) {
			var xx;
			var defaults ={'type':'dragNDrop', 'useUploadButton':'0', 'classes':{'dragText':'jrg-image-upload-drag-text', 'orText':'jrg-image-upload-or-text', 'uploadText':'jrg-image-upload-upload-text', 'browseInput':'jrg-image-upload-browse-input', 'browseButton':'jrg-image-upload-browse-button', 'uploadButton':'jrg-image-upload-upload-button'}, 'htmlUploading':'', 'showProgress':true};
			if(attrs.htmlUploading !==undefined) {
				defaults.showProgress =false;
			}

			for(xx in defaults) {
				if(attrs[xx] ===undefined) {
					if(typeof(defaults[xx]) =='object') {		//don't extend objects - will do that after this
						attrs[xx] ={};
					}
					else {
						attrs[xx] =defaults[xx];
					}
				}
			}
			for(xx in defaults.classes) {
				if(attrs.classes[xx] ===undefined) {
					attrs.classes[xx] =defaults.classes[xx];
				}
			}
		
			//convert to int
			var attrsToInt =['useUploadButton'];
			for(var ii=0; ii<attrsToInt.length; ii++) {
				attrs[attrsToInt[ii]] =parseInt(attrs[attrsToInt[ii]], 10);
			}
			
			if(attrs.id ===undefined) {
				attrs.id ="jrgImageUpload"+Math.random().toString(36).substring(7);
			}
			var fileTypeDisplay ="Image";
			var id1 =attrs.id;
			var ids ={
				'input':{
					'fileFake':id1+"FileFake",
					'file':id1+"File",
					'byUrl':id1+"ByUrl"
				},
				'progress':{
					'barInner':id1+"ProgressBarInner",
					'bar':id1+"ProgressBar"
				}
			};
			attrs.ids =ids;		//save for later
			//save in case need later / in service
			jrgImageUploadData[id1] ={
				'ids':ids
			};
			
			var htmlDisplay, htmlUrlInstructions;
			if(attrs.htmlDisplay !==undefined)
			{
				htmlDisplay =attrs.htmlDisplay;
				htmlDisplay +="<input ng-model='fileFake' id='"+ids.input.fileFake+"' type='hidden' disabled=disabled name='fakeupload' />";		//add in fake input to avoid errors when trying to fill it later
			}
			else
			{
				htmlDisplay ="<span class='"+attrs.classes.dragText+"'>Drag "+fileTypeDisplay+" Here</span><br />";
				htmlDisplay+="<span class='"+attrs.classes.orText+"'>--OR--</span><br />";
				htmlDisplay+="<span class='"+attrs.classes.uploadText+"'>Upload File:</span><br />";
				htmlDisplay+="<input ng-model='fileFake' id='"+ids.input.fileFake+"' type='text' disabled=disabled name='fakeupload' class='"+attrs.classes.browseInput+"' /><span class='"+attrs.classes.browseButton+"'>Browse</span>";
			}
			if(attrs.htmlUrlInstructions !==undefined)
			{
				htmlUrlInstructions =attrs.htmlUrlInstructions;
			}
			else
			{
				htmlUrlInstructions ="<span class='jrg-image-upload-by-url-instructions'>1. Right click an image on the web, 2. Choose \"Copy image URL\", 3. Paste it above!</span>";
			}
			
			//@todo - don't have access to cropOptions yet - in $scope..
			attrs.cropOptions ={
				'cropAspectRatio':1
			};
			var widthAspectDummyPercent =Math.floor(100 / attrs.cropOptions.cropAspectRatio);
			widthAspectDummyPercent =0;		//@todo - this doesn't seem to be working otherwise..
			
			var ngShow ={
				'dragNDrop':false,
				'uploadButton':false
			};
			if(attrs.type =='dragNDrop') {
				ngShow.dragNDrop =true;
				if(!attrs.useUploadButton) {
					ngShow.uploadButton =false;
				}
			}
			
			var html ="";
			html+="<div class='jrg-image-upload-form-container'>";
			html+="<form class='jrg-image-upload-form' enctype='multipart/form-data' method='post' action='{{uploadPath}}'>";
			
			html+="<div class='jrg-image-upload-fake-input-container' ng-show='"+ngShow.dragNDrop+"'>";
			html+="<div class='jrg-image-upload-fake-input-container-inner' ng-show='!imgSrc'>";
				html+="<div class='jrg-image-upload-aspect-ratio-dummy' style='padding-top:"+widthAspectDummyPercent+"%;'></div>";
				html+="<div class='jrg-image-upload-aspect-ratio-element'>";
					html+=htmlDisplay;
				html+="</div>";		//end: jrg-image-upload-aspect-ratio-element
			html+="</div>";		//end: dragNDropContainerDisplay
			html+="<div class='jrg-image-upload-picture-container' ng-show='{{show.pictureContainer}}'>";
				html+="<div class='jrg-image-upload-aspect-ratio-dummy' style='padding-top:"+widthAspectDummyPercent+"%;'></div>";
				html+="<div class='jrg-image-upload-aspect-ratio-element'>";
					html+="<div class='jrg-image-upload-picture-container-img-outer'>";
						html+="<img class='jrg-image-upload-picture-container-img' ng-src='{{imgSrc}}' />";
					html+="</div>";
				html+="</div>";		//end: jrg-image-upload-aspect-ratio-element
			html+="</div>";		//end: picture container
			//html+="<input ng-model='file' type='file' name='"+ids.input.file+"' id='"+ids.input.file+"' class='jrg-image-upload-input' ng-change='fileSelected({})' />";		//ng-change apparently doesn't work..  have to use onchange instead.. https://groups.google.com/forum/?fromgroups=#!topic/angular/er8Yci9hAto
			html+="<input ng-model='file' type='file' name='"+ids.input.file+"' id='"+ids.input.file+"' class='jrg-image-upload-input' onchange='angular.element(this).scope().fileSelected({})' />";
			html+="<div class='jrg-image-upload-picture-container-below' ng-show='{{show.pictureContainerBelow}}'>";
				html+="<div class='jrg-image-upload-picture-crop-div'><span class='jrg-image-upload-picture-crop-button'>Crop Thumbnail</span></div>";
				html+="<div class='jrg-image-upload-picture-container-text'>Click or drag onto the picture to change images</div>";
			html+="</div>";
			html+="<div class='jrg-image-upload-picture-crop-container'>";
			html+="</div>";
			//html+="<input type='hidden' name='"+inputIds.uploadDirectory+"' id='"+inputIds.uploadDirectory+"' value='"+uploadDirectory+"' />";		//not needed; can just send via form data when send the AJAX request
			html+="</div>";		//end: dragNDropContainer
			
			//if(attrs.type !='dragNDrop') {
			if(1) {
				html+="<div class='jrg-image-upload-by-url-container' ng-hide='"+ngShow.dragNDrop+"'>";
				html+="<span class='jrg-image-upload-by-url-text'>Upload From Other Website</span><br /><br />";
				html+="<input ng-model='fileByUrl' id='"+attrs.ids.input.byUrl+"' type='text' class='jrg-image-upload-by-url-input' placeholder='Copy & Paste URL here' />";
				html+=htmlUrlInstructions;
				html+="</div>";		//end: byUrlContainer
			}
			
			html+="</form>";
			html+="<div class='jrg-image-upload-upload-upload-button-container' ng-show='"+ngShow.uploadButton+"'><span class='"+attrs.classes.uploadButton+"' ng-click='uploadFile({})'>Upload</span></div>";
			html+="<div class='jrg-image-upload-notify' ng-show='{{show.notify}}'>"+attrs.htmlUploading+"</div>";
			html+="<div id='"+attrs.ids.progress.bar+"' class='jrg-image-upload-progress-bar'><div id='"+attrs.ids.progress.barInner+"' class='jrg-image-upload-progress-bar-inner'>&nbsp;</div></div>";
			html+="<div>{{progressNumber}}</div>";
			html+="<div>{{fileInfo.name}}</div>";
			html+="<div>{{fileInfo.size}}</div>";
			html+="<div>{{fileInfo.type}}</div>";

			html+="</div>";		//end: form container
	
			element.replaceWith(html);

			return function(scope, element, attrs) {
			};
		},
		
		controller: function($scope, $element, $attrs) {
			var defaults ={'cropOptions':jrgImageUploadData.cropOptionsDefault, 'serverParamNames':{'file':'file', 'byUrl':'fileData[fileUrl]'}, 'values':{}};
			if($scope.opts ===undefined) {
				$scope.opts ={};
			}
			for(var xx in defaults) {
				if($scope.opts[xx] ===undefined) {
					$scope.opts[xx] =defaults[xx];
				}
			}
			/*
			attrs.serverParamNames =$.extend({}, defaults.serverParamNames, params.serverParamNames);
			if(params.cropOptions !==undefined) {
				params.cropOptions =$.extend({}, defaults.cropOptions, params.cropOptions);
			}
			*/
			
			$scope.file ='';
			$scope.fileByUrl ='';
			$scope.imgSrc =$scope.opts.values.dirPath+$scope.opts.values.src;
			$scope.show ={
				'notify':false,
				// 'pictureContainer':false,
				'pictureContainer':true,		//can't dynamically change since doesn't show fast enough for image to be written/displayed properly
				'pictureContainerBelow':false
			};
			
			/**
			//1.
			@param params
				fileTypes =mixed: string of "image" OR 1D array [] of valid file types
			@return
				valid =boolean true if valid
				errorMsg =string of msg to display
			*/
			function checkFileType(fileName, params) {
				var returnArray ={'valid':true, 'errorMsg':''};
				var fileExtension =getFileExtension(fileName, params);
				if(params.fileTypes)
				{
					if(typeof(params.fileTypes) =='string')
					{
						if(params.fileTypes =='image')
						{
							params.fileTypes =['png', 'jpg', 'jpeg', 'bmp', 'gif'];
						}
						else
							params.fileTypes ='any';		//all will be valid
					}
					if(params.fileTypes !='any')
					{
						returnArray.valid =false;
						returnArray.errorMsg ="Allowed file types are: ";
						for(var ii=0; ii<params.fileTypes.length; ii++)
						{
							returnArray.errorMsg +=params.fileTypes[ii].toLowerCase();
							if(ii<(params.fileTypes.length-1))
								returnArray.errorMsg +=", ";
							if(params.fileTypes[ii].toLowerCase() ==fileExtension)
							{
								returnArray.valid =true;
								//break;		//don't break since want to complete error message
							}
						}
					}
				}
				return returnArray;
			}

			/**
			//2.
			*/
			function getFileExtension(fileName, params)
			{
				var ext =fileName.slice((fileName.lastIndexOf(".")+1), fileName.length).toLowerCase();
				return ext;
			}
			
			/**
			//3.
			*/
			$scope.fileSelected =function(params) {
				var file, retArray;
				if($attrs.type =='byUrl')
				{
					file =document.getElementById($attrs.ids.input.byUrl).value;
					//file =$scope.fileByUrl;		//not working?
					retArray =checkFileType(file, {'fileTypes':$scope.opts.fileTypes});
					if(!retArray.valid)		//invalid file type extension
					{
						document.getElementById($attrs.ids.input.byUrl).value ='';
						//$scope.fileByUrl ='';		//not working?
						alert(retArray.errorMsg);
					}
				}
				else		//drag n drop (regular file input)
				{
					file = document.getElementById($attrs.ids.input.file).files[0];
					//file = $scope.file;		//not working?
					if (file)
					{
						var fileSize = 0;
						if (file.size > 1024 * 1024)
							fileSize = (Math.round(file.size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
						else
							fileSize = (Math.round(file.size * 100 / 1024) / 100).toString() + 'KB';

						if(0)
						{
						document.getElementById(params.ids.fileName).innerHTML = 'Name: ' + file.name;
						document.getElementById(params.ids.fileSize).innerHTML = 'Size: ' + fileSize;
						document.getElementById(params.ids.fileType).innerHTML = 'Type: ' + file.type;
						}
					}
					if(file)
					{
						retArray =checkFileType(file.name, {'fileTypes':$scope.opts.fileTypes});
						if(!retArray.valid)		//invalid file type extension
						{
							document.getElementById($attrs.ids.input.file).value ='';
							//$scope.file ='';		//not working?
							alert(retArray.errorMsg);
						}
						else		//update fake file input (match with actual file input)
						{
							document.getElementById($attrs.ids.input.fileFake).value =document.getElementById($attrs.ids.input.file).value;
							//$scope.fileFake =$scope.file;		//not working?
						}
					}
				}
	
				//if not using upload button, immediately upload as well
				if(!$attrs.useUploadButton && $attrs.type =='dragNDrop') {
					$scope.uploadFile(params);
				}
			};
			
			/**
			//4.
			*/
			$scope.uploadFile =function(params) {
				var fileVal;
				if($attrs.htmlUploading) {
					$scope.show.notify =true;
				}
				if($attrs.fileUrl !==undefined) {
					fileVal =$attrs.fileUrl;
				}
				else if($attrs.type =='byUrl')
				{
					//LLoading.show({});
					fileVal =document.getElementById($attrs.ids.input.byUrl).value;
					//fileVal =$scope.fileByUrl;		//not working?
				}
				else {
					fileVal =document.getElementById($attrs.ids.input.file).value;
					//fileVal =$scope.file;		//not working?
				}
				//alert(fileVal);
				if(fileVal.length >0)
				{
					angular.element(document.getElementById($attrs.ids.progress.barInner)).css({'width':'0%'});
					if($attrs.showProgress) {
						var eleProgressBar =angular.element(document.getElementById($attrs.ids.progress.bar));
						eleProgressBar.removeClass('complete');
						eleProgressBar.addClass('loading');
					}
					else {
						//LLoading.show({});		//todo
					}
					
					var fd = new FormData();
					/*
					fd.append(params.inputIds.file, document.getElementById(params.inputIds.file).files[0]);
					fd.append(params.inputIds.uploadDirectory, params.uploadDirectory);
					*/
					if($attrs.type =='byUrl') {
						fd.append($scope.opts.serverParamNames.byUrl, fileVal);
					}
					else {
						fd.append($scope.opts.serverParamNames.file, document.getElementById($attrs.ids.input.file).files[0]);
						//fd.append($scope.opts.serverParamNames.file, $scope.file);		//not working?
					}
					fd.append('fileData[uploadDir]', $scope.opts.uploadDirectory);
					if($scope.opts.cropOptions !==undefined) {
						for(var xx in $scope.opts.cropOptions) {
							fd.append('cropOptions['+xx+']', $scope.opts.cropOptions[xx]);
						}
					}
					var sendInfo =fd;
					
					var xhr = new XMLHttpRequest();
					if($attrs.showProgress) {
						xhr.upload.addEventListener("progress", uploadProgress, false);
					}
					xhr.onload =function(ee){uploadComplete(ee, params); };
					//xhr.addEventListener("load", uploadComplete, false);
					xhr.onerror =function(ee){uploadFailed(ee, params); };		//doesn't seem to work..
					//xhr.addEventListener("error", uploadFailed, false);		//doesn't seem to work..
					xhr.addEventListener("abort", uploadCanceled, false);
					xhr.open("POST", $scope.opts.uploadPath);
					xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
					xhr.onreadystatechange =function(){
						if(xhr.readyState ==4 && xhr.status !=200)
						{
							uploadFailed('', params);
						}
					};
					xhr.send(sendInfo);
				
				}		//end: if(fileVal.length >0)
			};
			
			/**
			//5.
			*/
			function uploadProgress(evt) {
				if (evt.lengthComputable) {
					var percentComplete = Math.round(evt.loaded * 100 / evt.total);
					$scope.progressNumber =percentComplete.toString() + '%';
					document.getElementById($attrs.ids.progress.barInner).style.width = percentComplete.toString() +'%';
				}
				else {
					$scope.progressNumber = 'unable to compute';
				}
			}
			
			/**
			//6.
			@param params
				callback =array {'evtName':string, 'args':[]}
				uploadFileSimple =boolean true if no display
			*/
			function uploadComplete(evt, params) {
				/* This event is raised when the server send back a response */
				//alert(evt.target.responseText);
				
				document.getElementById($attrs.ids.progress.barInner).style.width = '100%';
				
				var ele1 =angular.element(document.getElementById($attrs.ids.progress.bar));
				ele1.addClass('complete');
				
				$scope.progressNumber ='';

				// var data =$.parseJSON(evt.target.responseText);
				var data =angular.fromJson(evt.target.responseText);
				//if(params.closeOnComplete)
					//DPopupObj.destroy({});
				afterComplete(params, data);
			}
			
			/**
			//6.25.
			*/
			function ajaxUploadComplete(params, data) {
				if(typeof(data) =='string') {
					// data =$.parseJSON(data);
					data =angular.fromJson(data);
				}
				afterComplete(params, data);
			}
			
			/**
			//6.5.
			*/
			function afterComplete(params, data) {
				//if(params.imageServerKeys !==undefined) {
				if(1) {
					//show uploaded image
					// $scope.show.pictureContainer =true;		//too late to change here.. doesn't work (image doesn't display)
					
					//thisObj.saveInstanceData(params.instanceId, data, params);
					var imgInfo ={};
					if(data[$scope.opts.imageServerKeys.imgFilePath] !==undefined) {
						imgInfo.imgSrc =data[$scope.opts];
						//thisObj.curData[params.instanceId][params.imageServerKeys.imgFilePath] =imgInfo.imgSrc;
					}
					else {
						imgInfo.imgSrc =$scope.opts.uploadDirectory+"/"+data[$scope.opts.imageServerKeys.imgFileName];
						//thisObj.curData[params.instanceId][params.imageServerKeys.imgFileName] =data[params.imageServerKeys.imgFileName];
					}
					//console.log("afterComplete: "+imgInfo.imgSrc);
					imgInfo.picHeight =data[$scope.opts.imageServerKeys.picHeight];
					imgInfo.picWidth =data[$scope.opts.imageServerKeys.picWidth];
					//thisObj.curData[params.instanceId][params.imageServerKeys.picHeight] =imgInfo.picHeight;
					//thisObj.curData[params.instanceId][params.imageServerKeys.picWidth] =imgInfo.picWidth;
					imgInfo.imgSrcCrop =imgInfo.imgSrc;
					imgInfo.picHeightCrop =imgInfo.picHeight;
					imgInfo.picWidthCrop =imgInfo.picWidth;
					if($scope.opts.cropOptions.crop) {
						var index1 =imgInfo.imgSrc.lastIndexOf('.');
						imgInfo.imgSrcCrop =imgInfo.imgSrc.slice(0, index1)+$scope.opts.cropOptions.cropDuplicateSuffix+imgInfo.imgSrc.slice(index1, imgInfo.imgSrc.length);
						imgInfo.picWidthCrop =$scope.opts.cropOptions.cropMaxWidth;
						imgInfo.picHeightCrop =$scope.opts.cropOptions.cropMaxHeight;
					}
					
					$scope.imgSrc =imgInfo.imgSrcCrop;		//just in case doesn't work below (sometimes doesn't show up the first time otherwise)
					var img = new Image();
					img.onload = function() {
						$scope.imgSrc =img.src;
						params.imgInfo =imgInfo;		//for passing through
						imgInfo.picHeightCrop =img.height;
						imgInfo.picWidthCrop =img.width;
						/*
						//@todo??
						thisObj.fixImageSizing({'divId':params.instanceId, 'id':params.ids.pictureContainerImgOuter, 'imgInfo':{'height':imgInfo.picHeightCrop, 'width':imgInfo.picWidthCrop} }, thisObj.afterCompleteResizing, [params, data]);
						//call again after timeout just in case since sadly the above doesn't work... - //to do - fix so it ALWAYS works and doesn't use a timeout (or continues to loop until it's non-zero width?? / the image is displayed??)
						setTimeout(function() {
							thisObj.fixImageSizing({'divId':params.instanceId, 'id':params.ids.pictureContainerImgOuter, 'imgInfo':{'height':imgInfo.picHeightCrop, 'width':imgInfo.picWidthCrop} }, thisObj.afterCompleteResizing, [params, data]);
						}, 1000);
						*/
					};
					//img.src =imgInfo.imgSrcCrop+'?'+LString.random(8,{});		//ensure new image shows up
					img.src =imgInfo.imgSrcCrop;
					/*
					//@todo
					if(img.height ==0) {		//invalid url; try uploads path
						//update BOTH (regular and crop) paths to upload
						if($scope.opts.cropOptions.crop) {
							imgInfo.imgSrc =$scope.opts.uploadDirectory+data[$scope.opts.imageServerKeys.imgFileName];
							imgInfo.imgSrcCrop =$scope.opts.uploadDirectory+LString.addFileSuffix(data[$scope.opts.imageServerKeys.imgFileName], $scope.opts.cropOptions.cropDuplicateSuffix, {});
							var imgPath1 =imgInfo.imgSrcCrop+'?'+LString.random(8,{});
						}
						else {
							imgInfo.imgSrc =$scope.opts.uploadDirectory+data[$scope.opts.imageServerKeys.imgFileName];
							imgInfo.imgSrcCrop =$scope.opts.uploadDirectory+data[$scope.opts.imageServerKeys.imgFileName];
							var imgPath1 =imgInfo.imgSrcCrop+'?'+LString.random(8,{});
						}
						img.src =imgPath1;
					}
					*/
				}
				
				$scope.ngModel =data[$scope.opts.imageServerKeys.imgFileName];		//set ngModel
				
				if($scope.opts.callbackInfo && ($scope.opts.callbackInfo ===undefined || !params.noCallback))
				{
					var args =$scope.opts.callbackInfo.args;
					args =args.concat(data);
					//$scope.$broadcast($scope.opts.callbackInfo.evtName, args);
					$scope.$emit($scope.opts.callbackInfo.evtName, args);
				}
				//LLoading.close({});
				$scope.show.notify =false;
				
				//ensure back in angular world so events fire now
				if(!$scope.$$phase) {
					$scope.$apply();
				}
			}
			
			/**
			//7.
			*/
			function uploadFailed(evt) {
				alert("There was an error attempting to upload the file. Please try again or try a different file.");
				//LLoading.close({});
			}

			/**
			//8.
			*/
			function uploadCanceled(evt) {
				alert("The upload has been canceled by the user or the browser dropped the connection.");
				//LLoading.close({});
			}
			
			//init({});		//init (called once when directive first loads)
		}
	};
}])
.factory('jrgImageUploadData', [ function () {
var inst ={
	cropOptionsDefault: {'crop':true, 'cropAspectRatio':1, 'cropMinHeight':100, 'cropMinWidth':100, 'cropMaxHeight':300, 'cropMaxWidth':300, 'cropDuplicateSuffix':"_crop"},		//'cropAspectRatio' =integer (1 = square, 2 = twice as wide as tall, .5 =twice as tall as wide)
	cropCoords: {'x1':0, 'x2':0, 'y1':0, 'y2':0},		//will hold 1D associative array of x1, x2, y1, y2
	cropCurrentImageSrc: "",
	cropInfoEdit: {'JcropApi':false, 'cropping':false},
	curData: {}		//will hold info such as the current file path; one per instance id
};
return inst;
}])
;