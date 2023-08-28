const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const St = imports.gi.St;


const CONTROLLER_CMD = ['/usr/bin/vncmanager-controller', '--start-setup', '--stdin' ];


let controller;
let stdoutChannel;

const VNCController = GObject.registerClass(
class VNCController extends PanelMenu.Button {
	_init() {
		super._init(St.Align.START);
                let label = new St.Label({ text: 'VNC', y_expand: true, y_align: Clutter.ActorAlign.CENTER });
		this.add_actor(label);
                this.connect('button-release-event', () => {
            		stdoutChannel.write_chars("TOGGLE\n", 7);
		        stdoutChannel.flush();
		});
        }
});

function enable() {
      let process = GLib.spawn_async_with_pipes(null, CONTROLLER_CMD, null, GLib.SpawnFlags.DEFAULT, null);
      if (!process[0]) {
          log ('Failed to start vncmanager-controller process.');
          return;
      }

      let stdinChannel = GLib.IOChannel.unix_new(process[3]);

      let result = stdinChannel.read_line();
      stdinChannel.close();

      if (result[0] != GLib.IOStatus.NORMAL || result[1] != "OK\n") {
          log ('The session is not managed by vncmanager: ' + result[0]);
          stdinChannel.close();
          return;
      }
      stdoutChannel = GLib.IOChannel.unix_new(process[2]);

      controller = new VNCController();
      Main.panel.addToStatusArea('vnccontroller', controller, 2);
}

function disable() {
      if (!controller)
          return;

      stdoutChannel.write_chars('QUIT\n', 5);
      stdoutChannel.close();

      controller.destroy();
}
