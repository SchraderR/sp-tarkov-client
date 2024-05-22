import { ipcMain } from 'electron';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';

export const toggleModStateEvent = () => {
  ipcMain.on('toggle-mod-state', (event, toggleModStateModel: ToggleModStateModel) => {
    console.log(toggleModStateModel);
    event.sender.send('toggle-mod-state-completed');
  });
};
