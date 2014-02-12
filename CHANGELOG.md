Version numbers correspond to `bower.json` version

# 1.0.7
# Bug Fixes
- display initial value if ngModel is set
- $watch ngModel to update / clear out on change


# 1.0.6
# Bug Fixes
- do not set serverVals if undefined - i.e. cropping would make ngModel undefined

# 1.0.5
# Features
- support dot notation for $scope.opts.imageServerKeys so can access nested return values (i.e. imgFileName:'result.fileNameSave')


# 1.0.4
# Features
- add crop support via angular-area-select directive
- add ImageMagick for backend cropping (optional - can use a different backend image manipulation library/code instead)


# 1.0.3
# Features
- generate image-upload.css and image-upload.min.css for non LESS support


# 1.0.2
## Bug Fixes
- add replace:true for new Angular 1.2.0 change to template function so there's not an extra wrapping <div> element


# 1.0.1
## Features
- support Angular 1.2.0 - switch to jqLite .on('change') instead of onchange='angular.element(this).scope()'


# 1.0.0

## Features

## Bug Fixes

## Breaking Changes