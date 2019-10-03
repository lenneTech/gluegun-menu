import { GluegunToolbox } from 'gluegun';

/**
 * Menu for gluegun
 */
export class Menu {
  /**
   * Constructor for integration of toolbox
   */
  constructor(protected toolbox: GluegunToolbox) {}

  /**
   * Show menu
   */
  public async showMenu(
    parentCommands?: string,
    options?: {
      level?: number;
      headline?: string;
    }
  ) {
    // Toolbox feature
    const {
      print,
      prompt,
      runtime: { brand, commands }
    } = this.toolbox;

    // Prepare parent command
    parentCommands = parentCommands ? parentCommands.trim() : '';

    // Process options
    const { level, headline } = Object.assign(
      {
        level: parentCommands ? parentCommands.split(' ').length : 0,
        headline: parentCommands ? parentCommands.charAt(0).toUpperCase() + parentCommands.slice(1) + ' commands' : ''
      },
      options
    );

    // Headline
    if (headline) {
      print.info(print.colors.cyan(headline));
    }

    // Get main commands
    let mainCommands = commands
      .filter(
        (c) =>
          // Get only children of current command
          c.commandPath.join(' ').startsWith(parentCommands) &&
          // Get only direct children of current command
          c.commandPath.length === level + 1 &&
          // Help will be added as additional command
          !['help'].includes(c.commandPath[0]) &&
          // Don't show CLI brand command
          !(level === 0 && [brand].includes(c.commandPath[0]))
      )
      .map((c) => c.commandPath[level] + (c.description ? ` (${c.description})` : ''))
      .sort();

    // Additional commands
    mainCommands = ['[ help ]'].concat(mainCommands);
    if (level) {
      mainCommands.push('[ back ]');
    }
    mainCommands.push('[ cancel ]');

    // Select command
    const { commandName } = await prompt.ask({
      type: 'select',
      name: 'commandName',
      message: 'Select command',
      choices: mainCommands.slice(0)
    });

    // Check command
    if (!commandName) {
      print.error('No command selected!');
      return;
    }

    switch (commandName) {
      case '[ back ]': {
        await this.showMenu(parentCommands.substr(0, parentCommands.lastIndexOf(' ')));
        return;
      }
      case '[ cancel ]': {
        print.info('Take care 👋');
        return;
      }
      case '[ help ]': {
        (print.printCommands as any)(this.toolbox, level ? parentCommands.split(' ') : undefined);
        break;
      }
      default: {
        // Get command
        const command = commands.filter(
          (c) => c.commandPath.join(' ') === `${parentCommands} ${commandName}`.trim().replace(/\s\(.*\)$/, '')
        )[0];

        // Run command
        try {
          await command.run(this.toolbox);
          process.exit();
        } catch (e) {
          // Abort via CTRL-C
          if (!e) {
            console.log('Goodbye ✌️');
          } else {
            // Throw error
            throw e;
          }
        }
      }
    }
  }
}

/**
 * Extend toolbox
 */
export default (toolbox: GluegunToolbox) => {
  toolbox.menu = new Menu(toolbox);
};
