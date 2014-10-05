Meteor.startup(function () {
  function updateUnreadLogsCountForChatRoom (roomSignature, user) {
    var chatRoomUnreadLogCount = UnreadLogsCount.findOne({
      room_signature: roomSignature, user: user.username
    }) || {};
    var timestamp = chatRoomUnreadLogCount.last_updated_at ||
      new Date();
    var count = chatRoomUnreadLogCount.count || 0;
    var offset = chatRoomUnreadLogCount.offset || 0;
    var currentIntervalCount = (
      chatRoomLogCount.getCurrentLogCountForInterval(roomSignature) || 0);
    count += chatRoomLogCount.getChatRoomLogsCountSince(
      roomSignature, timestamp, offset);
    UnreadLogsCount.upsert(
      {room_signature: roomSignature, user: user.username},
      {
        $set: {
          count: count,
          offset: currentIntervalCount,
          last_updated_at: new Date()
        }
      }
    );
  }

  Meteor.publish('unread_logs_count', function () {
    user = Meteor.users.findOne({_id: this.userId});
    if (!user) {
      this.ready();
      return;
    }
    var cursor = UnreadLogsCount.find({
      user: user.username});
    Meteor.setTimeout(function () {
      cursor.forEach(function (fields) {
        updateUnreadLogsCountForChatRoom(fields.room_signature, user);
      });
      cursor.observeChanges({
        added: function (id, fields) {
          updateUnreadLogsCountForChatRoom(fields.room_signature, user);
        }
      });
    }, 100);
    if (!cursor.count())
      this.ready();
    return cursor;
  });
});