'use strict';

app.controller('AboutController', ['$scope', 'appconf', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper',
function($scope, appconf, menu, serverconf, scaMessage, toaster, jwtHelper) {
    scaMessage.show(toaster);
    $scope.appconf = appconf;
}]);

//load common stuff that most controller uses
app.controller('PageController', ['$scope', 'appconf', '$route', 'serverconf', 'menu',
function($scope, appconf, $route, serverconf, menu) {
    $scope.appconf = appconf; 
    $scope.title = appconf.title;
    serverconf.then(function(_c) { $scope.serverconf = _c; });
    $scope.menu = menu;
    $scope.user = menu.user; //for app menu
    $scope.i_am_header = true;
}]);

//list all available workflows and instances
app.controller('WorkflowsController', ['$scope', 'menu', 'scaMessage', 'toaster', 'jwtHelper', '$location', '$http', 'appconf',
function($scope, menu, scaMessage, toaster, jwtHelper, $location, $http, appconf) {
    scaMessage.show(toaster);

    $http.get(appconf.api+'/instance')
    .then(function(res) {
        $scope.instances = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    //load available workflows (TODO - add querying capability)
    $http.get(appconf.api+'/workflow')
    .then(function(res) {
        $scope.workflows = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });
    
    //load running tasks
    $http.get(appconf.api+'/task', {params: {
        where: {status: "running"}, 
    }})
    .then(function(res) {
        $scope.running_tasks = {};
        //organize running tasks into each workflows
        res.data.forEach(function(task) {
            if(!$scope.running_tasks[task.instance_id]) $scope.running_tasks[task.instance_id] = [];
            $scope.running_tasks[task.instance_id].push(task); 
        });
        //console.dir($scope.running_tasks);
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    /*
    workflows.get().then(function(workflows) {
        //console.dir(workflows);
        $scope.workflows = workflows;
    });
    */
    $scope.openwf = function(wid) {
        $location.path("/workflow/"+wid);
    }
    $scope.openinst = function(inst) {
        window.open($scope.workflows[inst.workflow_id].url+"#/start/"+inst._id, 'scainst:'+inst._id);
    }
}]);

//show workflow detail (not instance)
app.controller('WorkflowController', ['$scope', 'appconf', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper', '$location', '$routeParams', '$http',
function($scope, appconf, menu, serverconf, scaMessage, toaster, jwtHelper, $location, $routeParams, $http) {
    scaMessage.show(toaster);
    
    $http.get(appconf.api+'/workflow/'+$routeParams.id)
    .then(function(res) {
        $scope.workflow = res.data;

        //load instances under this workflow (for this user)
        $http.get(appconf.api+'/instance', {params: {
            where: {workflow_id: $scope.workflow.name},
        }})
        .then(function(res) {
            $scope.instances = res.data;
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $http.get(appconf.api+'/comment/workflow/'+$routeParams.id)
    .then(function(res) {
        $scope.comments = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $scope.back = function() {
        $location.path("/workflows");
    }

    $scope.form = {};
    $scope.submit = function() {
        return $http.post(appconf.api+'/instance/'+$routeParams.id, {
            name: $scope.form.name,
            desc: $scope.form.desc,
        }).then(function(res) {
            var instance = res.data;
            //scaMessage.success("Created a new workflow instance"); //TODO unnecessary?
            window.open($scope.workflow.url+"#/start/"+instance._id, 'scainst:'+instance._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.addcomment = function() {
        //console.dir($scope.comment);
        $http.post(appconf.api+'/comment/workflow/'+$routeParams.id, {
            text: $scope.comment,
        }).then(function(res) {
            $scope.comments.push(res.data);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
    $scope.openinst = function(inst) {
        window.open($scope.workflow.url+"#/start/"+inst._id, 'scainst:'+inst._id);
    }
}]);

//show list of all workflow instances that user owns
app.controller('InstsController', ['$scope', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper', '$location',
function($scope, menu, serverconf, scaMessage, toaster, jwtHelper, $location) {
    scaMessage.show(toaster);
    
    //load available workflows (TODO - add querying capability)
    $http.get(appconf.api+'/workflow')
    .then(function(res) {
        $scope.workflows = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    /*
    workflows.getInsts().then(function(mine) {
        $scope.workflows = mine;
    });
    */
    /*
    $scope.create = function() {
        workflows.create().then(function(res) {
            var workflow = res.data;
            scaMessage.success("Created a new workflow instance"); //TODO unnecessary?
            document.location("inst/#/"+workflow._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    };
    */
}]);

//TODO will be moved to inst.js
app.controller('InstController', ['$scope', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper', '$routeParams', '$http', '$modal',
function($scope, menu, serverconf, scaMessage, toaster, jwtHelper, $routeParams, $http, $modal) {
    scaMessage.show(toaster);
    serverconf.then(function(_serverconf) { $scope.serverconf = _serverconf; });

    $scope.workflow = {steps: []}; //so that I can start watching workflow immediately
    $scope._products = [];

    $http.get($scope.appconf.api+'/workflow/'+$routeParams.id)
    .then(function(res) {
        $scope.workflow = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $scope.$watch('workflow', function(nv, ov) {
        $scope._products.length = 0; //clear without changing reference 
        $scope.workflow.steps.forEach(function(step) {
            step.tasks.forEach(function(task) {
                for(var product_idx = 0;product_idx < task.products.length; product_idx++) {
                    var product = task.products[product_idx];                
                    $scope._products.push({
                        product: product,
                        step: step,    
                        task: task, 
                        service_detail: $scope.serverconf.services[task.service_id],
                        product_idx: product_idx
                    });
                }
            });
        });
    }, true);//deepwatch-ing the entire workflow maybe too expensive..

    ///////////////////////////////////////////////////////////////////////////////////////////////
    //functions

    //TODO rename to just save()?
    $scope.save_workflow = function() {
        $http.put($scope.appconf.api+'/workflow/'+$routeParams.id, $scope.workflow)
        .then(function(res) {
            console.log("workflow updated");
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.removestep = function(idx) {
        $scope.workflow.steps.splice(idx, 1);
        $scope.save_workflow();
    }

    $scope.addstep = function(idx) {
        var modalInstance = $modal.open({
            //animation: $scope.animationsEnabled,
            templateUrl: 't/workflow.step_selector.html',
            controller: 'WorkflowStepSelectorController',
            size: 'lg',
            resolve: {
                //TODO what is this?
                items: function () {
                    return {'item': 'here'}
                }
            }
        });

        modalInstance.result.then(function(service) {
            //instantiate new step
            //var newstep = angular.copy(service.default);
            var newstep = {
                service_id: service.id,
                name: 'untitled',
                config: service.default,
                tasks: [],
            };
            //finally, add the step and update workflow
            if(idx === undefined) $scope.workflow.steps.push(newstep);
            else $scope.workflow.steps.splice(idx, 0, newstep);
            $scope.save_workflow();
        }, function () {
            //toaster.success('Modal dismissed at: ' + new Date());
        });
    };
}]);

app.controller('WorkflowStepSelectorController', ['$scope', '$modalInstance', 'items', 'serverconf', 
function($scope, $modalInstance, items, serverconf) {
    serverconf.then(function(_serverconf) {
        $scope.groups = [];
        $scope.services_a = [];
        for(var service_id in  _serverconf.services) {
            var service = _serverconf.services[service_id];
            service.id = service_id;
            $scope.services_a.push(service);
            if(!~$scope.groups.indexOf(service.group)) $scope.groups.push(service.group);
        }
    });
    $scope.service_selected = null;
    $scope.select = function(service) {
        $scope.service_selected = service;
    }
    $scope.ok = function () {
        $modalInstance.close($scope.service_selected);
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

app.controller('ResourcesController', ['$scope', 'menu', 'serverconf', 'scaMessage', 'toaster', 'jwtHelper', '$routeParams', '$http', 'resources', 'scaSettingsMenu', '$uibModal',
function($scope, menu, serverconf, scaMessage, toaster, jwtHelper, $routeParams, $http, resources, scaSettingsMenu, $uibModal) {
    scaMessage.show(toaster);
    $scope.settings_menu = scaSettingsMenu;

    serverconf.then(function(_c) { 
        $scope.serverconf = _c; 
        resources.getall().then(function(resources) {
            $scope.myresources = resources;
        });
    });

    /*
    $scope.submit = function(resource) {
        resources.upsert(resource).then(function(res) {
            toaster.success("successfully updated the resource configuration");
            //update with new content without updating anything else
            for(var k in res.data) { resource[k] = res.data[k]; }
        }, function(res) {     
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
    */

    $scope.addnew = function(resource) {
        var modalInstance = create_dialog(resource);
        modalInstance.result.then(function(_inst) {
            $http.post($scope.appconf.api+'/resource/', _inst)
            .then(function(res) {
                toaster.success("Updated resource");
            }, function(res) {
                if(res.data && res.data.message) toaster.error(res.data.message);
                else toaster.error(res.statusText);
            });
            $scope.myresources.push(_inst);
        }, function () {
            //anything to do when user dismiss?
        });
    }


    $scope.edit = function(resource, inst) {
        var modalInstance = create_dialog(resource, inst);
        modalInstance.result.then(function(_inst) {
            $http.put($scope.appconf.api+'/resource/'+_inst._id, _inst)
            .then(function(res) {
                toaster.success("Updated resource");
            }, function(res) {
                if(res.data && res.data.message) toaster.error(res.data.message);
                else toaster.error(res.statusText);
            });
            //update original
            for(var k in inst) inst[k] = _inst[k];
        }, function () {
            //anything to do when user dismiss?
        });
    }

    $scope.autoconf = function() {
        alert('todo.. please configure your resources manually for now');
    }

    function create_dialog(resource, inst) {
        var template = null;

        //TODO default username to SCA username?
        var def = {active: true, config: {}, type: resource.type, resource_id: resource._rid};
        switch(resource.type) {
        case "hpss":
            template = "resources.hpss.html"; 
            def.config.auth_method = 'keytab';
            break;
        default:
            template = "resources.ssh.html";
        }

        return $uibModal.open({
            templateUrl: template,
            controller: function($scope, inst, resource, $uibModalInstance, $http, appconf) {
                if(inst) {
                    //update
                    $scope.inst = angular.copy(inst);
                } else {
                    //new
                    $scope.inst = def;

                    console.log("generating key");
                    $http.get(appconf.api+'/resource/gensshkey/')
                    .then(function(res) {
                        $scope.inst.config.ssh_public = res.data.pubkey;
                        $scope.inst.config.enc_ssh_private = res.data.key;
                    }, function(res) {
                        if(res.data && res.data.message) toaster.error(res.data.message);
                        else toaster.error(res.statusText);
                    });
                }

                $scope.resource = resource;
                //console.dir(inst);
                $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                }
                $scope.remove = function() {
                    alert("todo");
                }
                $scope.ok = function() {
                    $uibModalInstance.close($scope.inst);
                }
            },
            //size: 'lg',
            backdrop: 'static',
            resolve: {
                inst: function () { return inst; },
                resource: function () { return resource; }
            }
        });
    }
    /*
    $scope.newresource_id = null;
    $scope.add = function() {
        resources.add($scope.newresource_id);
    }

    $scope.reset_sshkey = function(resource) {
        $http.post($scope.appconf.api+'/resource/resetsshkeys/'+resource._id)
        .then(function(res) {
            toaster.success("Successfully reset your ssh keys. Please update your public key in ~/.ssh/authorized_keys!");
            resource.config.ssh_public = res.data.ssh_public;
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
    */
}]);

