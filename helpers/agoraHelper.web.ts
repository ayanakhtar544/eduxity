// agoraHelper.web.ts
// Web par Agora native SDK nahi chalta, isliye hum dummy functions de rahe hain
export const createAgoraRtcEngine = () => ({
  initialize: () => {},
  setChannelProfile: () => {},
  addListener: () => {},
  enableAudio: () => {},
  joinChannel: () => {},
  leaveChannel: () => {},
  release: () => {},
  muteLocalAudioStream: () => {},
});

export const ClientRoleType = { ClientRoleBroadcaster: 1 };
export const ChannelProfileType = { ChannelProfileCommunication: 0 };