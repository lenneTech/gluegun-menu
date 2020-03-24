import { GluegunToolbox } from 'gluegun';

/**
 * Menu for gluegun
 */
export class Menu {
  private optionsCache: any;
  /**
   * Constructor for integration of toolbox
   */
  constructor(protected toolbox: GluegunToolbox) {
    this.optionsCache = {}
  }

  /**
   * Show menu
   */
  public async showMenu(
    parentCommands?: string,
    options?: {
      level?: number;
      headline?: string;
      showHelp?: boolean;
      setCache?: boolean;
      helpLabel?: string;
      backLabel?: string;
      cancelLabel?: string;
      byeMessage?: string;
    }
  ) {
    if (
      options && options.setCache
      && (
        !!options.showHelp || !!options.helpLabel
        || !!options.backLabel || !!options.cancelLabel
        || !!options.byeMessage
      )) {
      // save everything except level, headline & setCache
      this.optionsCache = { ...options };
      delete this.optionsCache.level;
      delete this.optionsCache.headline;
      delete this.optionsCache.setCache;
    }

    options = {
      ...this.optionsCache,
      ...options
    };
    const messages = {
      help: options.helpLabel || '[ help ]',
      back: options.backLabel || '[ back ]',
      cancel: options.cancelLabel || '[ cancel ]',
      bye: options.byeMessage || 'Take care 👋',
    }

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
        (c: any) =>
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
    if (options.showHelp !== false) {
      mainCommands = [messages.help].concat(mainCommands)
    }

    if (level) {
      mainCommands.push(messages.back);
    }

    mainCommands.push(messages.cancel);

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
      case messages.back: {
          // Get command
         let command = commands.filter(
           (c: any) =>
             c.commandPath.join(' ') === parentCommands
               .trim().replace(/\s\(.*\)$/, '')
               .split(' ').slice(0,-1).join(' ')
         )[0];
         if (!command) {
           command = commands[0];
         }

         // Run command
         try {
           this.toolbox.parameters.options.fromGluegunMenu = true;
           await command.run(this.toolbox);
           process.exit();
         } catch (e) {
           // Abort via CTRL-C
           if (!e) {
             console.log(messages.bye);
           } else {
             // Throw error
             throw e;
           }
         }
         break;
      }
      case messages.cancel: {
        print.info(messages.bye);
        return;
      }
      case messages.help: {
        (print.printCommands as any)(this.toolbox, level ? parentCommands.split(' ') : undefined);
        break;
      }
      default: {
        // Get command
        const command = commands.filter(
          (c: any) => c.commandPath.join(' ') === `${parentCommands} ${commandName}`.trim().replace(/\s\(.*\)$/, '')
        )[0];

        // Run command
        try {
          this.toolbox.parameters.options.fromGluegunMenu = true;
          await command.run(this.toolbox);
          process.exit();
        } catch (e) {
          // Abort via CTRL-C
          if (!e) {
            console.log(messages.bye);
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
  // Add menu
  toolbox.menu = new Menu(toolbox);

  // Add the function to query whether the command was started from the menu
  toolbox.fromMenu = () => {
    return toolbox.parameters.options.fromGluegunMenu;
  };
};
