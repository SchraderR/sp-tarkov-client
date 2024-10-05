import { ipcMain, Notification } from 'electron';

export const handleNotificationEvents = () => {
  ipcMain.on('notification-publish', (event, mod: { modName: string; modVersion: string }) => {
    const NOTIFICATION_TITLE = `Update available for ${mod.modName}`;
    const NOTIFICATION_BODY = `Version ${mod.modVersion} published for ${mod.modName}`;

    new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY, icon: 'app/assets/icon.png' }).show();

    event.sender.send('notification-publish-completed');
  });
};
