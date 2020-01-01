import { GluegunToolbox } from 'gluegun';
import { Menu } from '../extensions/menu.extension';

/**
 * GluegunToolbox with menu extension
 */
export interface GluegunMenuToolbox extends GluegunToolbox {
  menu?: Menu;
  fromMenu?: () => boolean;
}
