(function (app) {
    'use strict';

    app.controller('MeetingCtrl',
        function ($scope, $state, $location, $stateParams, $localStorage, $rootScope, Pusher, Constants, Video, Speech, Api, DataChan, Error, Utils, Room, $timeout, $sce, roomDetails) {

            $scope.fullPath = $location.absUrl();
            $scope.currentUser = $localStorage.userName.name;
            $scope.trustSrc = function(src) {
                return $sce.trustAsResourceUrl(src);
            };

            Room.setId($stateParams.roomId);

            Pusher.init(Room.getId());

            $scope.clipboardSuccess = function(e) {
                $scope.notification = 'The url has been copied to your clipboard!';
                $scope.toggleFeature('clipboard', false);
                $timeout(function() {
                    $scope.notification = null;
                }, 3000);
            };


            // Modal
            $scope.showModal = false;
            $scope.toggleModal = function() {
                $scope.showModal = !$scope.showModal;
            };


            // Video
            Video.init(Room.getId());

            $scope.recording = false;

            $scope.startRecording = function () {
                Video.startRecording();
                $scope.recording = true;
            };

            $scope.stopRecording = function () {
                Video.stopRecording();
                $scope.recording = false;
            };

            // Speech
            Speech.init();

            // Actions
            $scope.toggleSide = function(feature, force) {
                if (typeof force !== 'undefined') {
                    $scope.side.show = force;
                } else {
                    $scope.side.show = !$scope.side.show;
                }

                $scope.toggleFeature(feature);
            };


            $scope.toggleBot = function(feature) {
                if (!$scope.isFeatureActive(feature)) {
                    addFeature(feature);
                    initBot();
                } else {
                    removeFeature(feature);
                    source.disconnect();
                    LoopVisualizer.remove();

                }
            };


            $scope.toggleScreenShare = function(feature) {

                if (!$scope.isFeatureActive(feature)) {
                    Video.shareScreen(function(error) {
                        removeFeature(feature);
                    });
                    addFeature(feature);
                } else {
                    Video.stopScreen();
                    removeFeature(feature);
                }
                source.disconnect();
                LoopVisualizer.remove();
            };

            $scope.toggleFeature = function(feature) {
                var index = $scope.side.activeFeatures.indexOf(feature);

                if (index === -1) {
                    $scope.side.activeFeatures.push(feature);
                } else {
                    $scope.side.activeFeatures.splice(index, 1);
                }

                source.disconnect();
                LoopVisualizer.remove();
            };

            $scope.showFrame = false;
            $scope.ownsFrame = false;

            $scope.toggleFrame = function(feature, force, isEvent) {
                toggleFrame(feature, force, isEvent);
                var payload = {
                    id: Utils.generateId(),
                    type: Constants.types.shareLink,
                    userName: $localStorage.userName,
                    created: new Date()
                };

                Pusher.emitServer(payload);
                $rootScope.$emit(Constants.events.shareLink, payload);
                $scope.ownsFrame = $scope.showFrame;

            };

            function toggleFrame(feature, force, isEvent) {
                if (!$scope.isFeatureActive(feature) || force) {
                    $scope.showFrame = true;
                    addFeature(feature);
                    if (!isEvent) {
                        Pusher.emit(Constants.events.shareLink, 'ok');
                    }
                } else {
                    $scope.showFrame = false;
                    removeFeature(feature);
                }
                source.disconnect();
                LoopVisualizer.remove();
            }

            Pusher.on(Constants.events.shareLink, function() {
                toggleFrame('share-link', true, true);
            });

            function addFeature(feature) {
                var index = $scope.side.activeFeatures.indexOf(feature);

                if (index === -1) {
                    $scope.side.activeFeatures.push(feature);
                }
            }

            function removeFeature(feature) {
                var index = $scope.side.activeFeatures.indexOf(feature);

                if (index !== -1) {
                    $scope.side.activeFeatures.splice(index, 1);
                }
            }


            $scope.toggleMuteAudio = function(feature) {
                Video.toggleMuteAudio();
                $scope.toggleFeature(feature);

            };

            $scope.toggleMuteVideo = function(feature) {
                Video.toggleMuteVideo();
                $scope.toggleFeature(feature);
            };

            $scope.isFeatureActive = function(feature) {
                return $scope.side.activeFeatures.indexOf(feature) !== -1;
            };

            $scope.toggleBot('bot-mute');

            $rootScope.removeFeature = removeFeature;


        });

}(angular.module('cahoots')));
