/**
 * GML built-in function and variable definitions for hover info and completions.
 * These are native GameMaker elements commonly exposed through Catspeak.
 */

export interface GmlBuiltin {
  name: string;
  signature: string;
  description: string;
  params: { name: string; description: string }[];
  returns: string;
  kind: 'function' | 'variable' | 'constant' | 'keyword';
}

export const GML_BUILTINS: Map<string, GmlBuiltin> = new Map();

function def(b: Omit<GmlBuiltin, 'kind'> & { kind?: GmlBuiltin['kind'] }): void {
  GML_BUILTINS.set(b.name, { ...b, kind: b.kind ?? 'function' } as GmlBuiltin);
}

function defVar(name: string, type: string, description: string): void {
  GML_BUILTINS.set(name, {
    name, signature: name, description, params: [], returns: type, kind: 'variable',
  });
}

function defConst(name: string, type: string, description: string): void {
  GML_BUILTINS.set(name, {
    name, signature: name, description, params: [], returns: type, kind: 'constant',
  });
}

function defKeyword(name: string, description: string): void {
  GML_BUILTINS.set(name, {
    name, signature: name, description, params: [], returns: '', kind: 'keyword',
  });
}

// -- Instance Keywords --
defKeyword('self', 'Refers to the current instance executing the code. Used to access the instance\'s own variables and methods.');
defKeyword('other', 'Refers to the "other" instance involved in a collision event, or the calling instance in a with() statement.');
defKeyword('all', 'Refers to all active instances in the room. Used with functions like instance_destroy() or with().');
defKeyword('noone', 'A special constant representing no instance (value -4). Used to check if an instance reference is invalid.');
defKeyword('global', 'Accesses the global scope. Variables stored on global persist across all instances and rooms.');

// -- Common Instance Variables --
defVar('x', 'Real', 'The x-coordinate of the instance in the room.');
defVar('y', 'Real', 'The y-coordinate of the instance in the room.');
defVar('xprevious', 'Real', 'The x-coordinate of the instance in the previous step.');
defVar('yprevious', 'Real', 'The y-coordinate of the instance in the previous step.');
defVar('xstart', 'Real', 'The x-coordinate where the instance was created.');
defVar('ystart', 'Real', 'The y-coordinate where the instance was created.');
defVar('hspeed', 'Real', 'The horizontal speed of the instance (pixels per step).');
defVar('vspeed', 'Real', 'The vertical speed of the instance (pixels per step).');
defVar('speed', 'Real', 'The overall speed of the instance (pixels per step).');
defVar('direction', 'Real', 'The direction of movement in degrees (0 = right, 90 = up, 180 = left, 270 = down).');
defVar('friction', 'Real', 'The amount of friction applied to the instance speed each step.');
defVar('gravity', 'Real', 'The amount of gravity applied to the instance each step.');
defVar('gravity_direction', 'Real', 'The direction of gravity in degrees.');
defVar('image_index', 'Real', 'The current sub-image index of the sprite being displayed.');
defVar('image_speed', 'Real', 'The speed at which the sprite sub-images animate (1 = one frame per step).');
defVar('image_xscale', 'Real', 'The horizontal scale of the sprite (1 = normal, -1 = flipped).');
defVar('image_yscale', 'Real', 'The vertical scale of the sprite (1 = normal, -1 = flipped).');
defVar('image_angle', 'Real', 'The rotation angle of the sprite in degrees.');
defVar('image_alpha', 'Real', 'The transparency of the sprite (0 = invisible, 1 = fully opaque).');
defVar('image_blend', 'Colour', 'The blend colour applied to the sprite.');
defVar('sprite_index', 'Asset.GMSprite', 'The sprite resource assigned to this instance.');
defVar('sprite_width', 'Real', 'The width of the current sprite.');
defVar('sprite_height', 'Real', 'The height of the current sprite.');
defVar('mask_index', 'Asset.GMSprite', 'The sprite used for collision detection. Set to -1 to use sprite_index.');
defVar('depth', 'Real', 'The drawing depth of the instance. Lower values are drawn on top.');
defVar('layer', 'Layer ID', 'The layer the instance belongs to.');
defVar('visible', 'Bool', 'Whether the instance is visible and will be drawn.');
defVar('solid', 'Bool', 'Whether the instance is solid for collision purposes.');
defVar('persistent', 'Bool', 'Whether the instance persists when changing rooms.');
defVar('alarm', 'Array<Real>', 'Array of alarm timers (alarm[0] through alarm[11]). Counts down each step.');
defVar('object_index', 'Asset.GMObject', 'The object resource this instance was created from.');
defVar('id', 'Id.Instance', 'The unique instance ID of this instance.');
defVar('bbox_left', 'Real', 'The left edge of the instance bounding box.');
defVar('bbox_right', 'Real', 'The right edge of the instance bounding box.');
defVar('bbox_top', 'Real', 'The top edge of the instance bounding box.');
defVar('bbox_bottom', 'Real', 'The bottom edge of the instance bounding box.');

// -- Room/Game Variables --
defVar('room', 'Asset.GMRoom', 'The current room index.');
defVar('room_width', 'Real', 'The width of the current room in pixels.');
defVar('room_height', 'Real', 'The height of the current room in pixels.');
defVar('room_speed', 'Real', 'The game speed for the current room in steps per second.');
defVar('fps', 'Real', 'The current frames per second the game is running at.');
defVar('fps_real', 'Real', 'The actual measured frames per second.');
defVar('delta_time', 'Real', 'The time elapsed since the last frame in microseconds.');
defVar('current_time', 'Real', 'The number of milliseconds since the game started.');
defVar('game_id', 'Real', 'A unique identifier for the running game.');

// -- View/Camera Variables --
defVar('view_enabled', 'Bool', 'Whether views are enabled in the current room.');
defVar('view_current', 'Real', 'The index of the view currently being drawn.');
defVar('camera_get_view_x', 'Real', 'The x-coordinate of the camera view.');
defVar('camera_get_view_y', 'Real', 'The y-coordinate of the camera view.');

// -- Input Variables --
defVar('mouse_x', 'Real', 'The x-coordinate of the mouse in the room.');
defVar('mouse_y', 'Real', 'The y-coordinate of the mouse in the room.');
defVar('keyboard_key', 'Real', 'The keycode of the last key pressed.');
defVar('keyboard_lastkey', 'Real', 'The keycode of the most recently pressed key.');
defVar('keyboard_string', 'String', 'A string of the last keyboard input characters.');

// -- Constants --
defConst('pi', 'Real', 'The mathematical constant pi (3.14159...).');
defConst('true', 'Bool', 'Boolean true value (1).');
defConst('false', 'Bool', 'Boolean false value (0).');
defConst('undefined', 'Undefined', 'Represents an undefined or uninitialized value.');
defConst('infinity', 'Real', 'Represents positive infinity.');
defConst('NaN', 'Real', 'Represents Not-a-Number.');
defConst('mb_left', 'Constant', 'Mouse button constant for the left mouse button.');
defConst('mb_right', 'Constant', 'Mouse button constant for the right mouse button.');
defConst('mb_middle', 'Constant', 'Mouse button constant for the middle mouse button.');
defConst('vk_left', 'Constant', 'Virtual key constant for the left arrow key.');
defConst('vk_right', 'Constant', 'Virtual key constant for the right arrow key.');
defConst('vk_up', 'Constant', 'Virtual key constant for the up arrow key.');
defConst('vk_down', 'Constant', 'Virtual key constant for the down arrow key.');
defConst('vk_space', 'Constant', 'Virtual key constant for the space bar.');
defConst('vk_enter', 'Constant', 'Virtual key constant for the enter/return key.');
defConst('vk_escape', 'Constant', 'Virtual key constant for the escape key.');
defConst('vk_shift', 'Constant', 'Virtual key constant for the shift key.');
defConst('vk_control', 'Constant', 'Virtual key constant for the control key.');
defConst('vk_alt', 'Constant', 'Virtual key constant for the alt key.');
defConst('c_white', 'Colour', 'The colour white.');
defConst('c_black', 'Colour', 'The colour black.');
defConst('c_red', 'Colour', 'The colour red.');
defConst('c_green', 'Colour', 'The colour green.');
defConst('c_blue', 'Colour', 'The colour blue.');
defConst('c_yellow', 'Colour', 'The colour yellow.');
defConst('c_orange', 'Colour', 'The colour orange.');
defConst('c_aqua', 'Colour', 'The colour aqua/cyan.');

// -- Math --
def({ name: 'abs', signature: 'abs(val)', description: 'Returns the absolute value of the given number.', params: [{ name: 'val', description: 'The value to get the absolute of' }], returns: 'Real' });
def({ name: 'sign', signature: 'sign(val)', description: 'Returns -1, 0, or 1 depending on the sign of the value.', params: [{ name: 'val', description: 'The value to check the sign of' }], returns: 'Real' });
def({ name: 'round', signature: 'round(val)', description: 'Rounds the value to the nearest integer.', params: [{ name: 'val', description: 'The value to round' }], returns: 'Real' });
def({ name: 'floor', signature: 'floor(val)', description: 'Returns the largest integer less than or equal to the value.', params: [{ name: 'val', description: 'The value to floor' }], returns: 'Real' });
def({ name: 'ceil', signature: 'ceil(val)', description: 'Returns the smallest integer greater than or equal to the value.', params: [{ name: 'val', description: 'The value to ceil' }], returns: 'Real' });
def({ name: 'min', signature: 'min(val1, val2, ...)', description: 'Returns the smallest of the given values.', params: [{ name: 'val1', description: 'First value' }, { name: 'val2', description: 'Second value' }], returns: 'Real' });
def({ name: 'max', signature: 'max(val1, val2, ...)', description: 'Returns the largest of the given values.', params: [{ name: 'val1', description: 'First value' }, { name: 'val2', description: 'Second value' }], returns: 'Real' });
def({ name: 'clamp', signature: 'clamp(val, min, max)', description: 'Clamps a value between a minimum and maximum.', params: [{ name: 'val', description: 'The value to clamp' }, { name: 'min', description: 'Minimum bound' }, { name: 'max', description: 'Maximum bound' }], returns: 'Real' });
def({ name: 'lerp', signature: 'lerp(a, b, amt)', description: 'Linearly interpolates between two values.', params: [{ name: 'a', description: 'Start value' }, { name: 'b', description: 'End value' }, { name: 'amt', description: 'Interpolation amount (0-1)' }], returns: 'Real' });
def({ name: 'sqrt', signature: 'sqrt(val)', description: 'Returns the square root of the value.', params: [{ name: 'val', description: 'The value' }], returns: 'Real' });
def({ name: 'power', signature: 'power(val, exp)', description: 'Returns val raised to the power of exp.', params: [{ name: 'val', description: 'Base value' }, { name: 'exp', description: 'Exponent' }], returns: 'Real' });
def({ name: 'sin', signature: 'sin(angle)', description: 'Returns the sine of the angle (in radians).', params: [{ name: 'angle', description: 'Angle in radians' }], returns: 'Real' });
def({ name: 'cos', signature: 'cos(angle)', description: 'Returns the cosine of the angle (in radians).', params: [{ name: 'angle', description: 'Angle in radians' }], returns: 'Real' });
def({ name: 'tan', signature: 'tan(angle)', description: 'Returns the tangent of the angle (in radians).', params: [{ name: 'angle', description: 'Angle in radians' }], returns: 'Real' });
def({ name: 'random', signature: 'random(n)', description: 'Returns a random real number between 0 and n (exclusive).', params: [{ name: 'n', description: 'Upper bound (exclusive)' }], returns: 'Real' });
def({ name: 'random_range', signature: 'random_range(n1, n2)', description: 'Returns a random real number between n1 and n2.', params: [{ name: 'n1', description: 'Lower bound' }, { name: 'n2', description: 'Upper bound' }], returns: 'Real' });
def({ name: 'irandom', signature: 'irandom(n)', description: 'Returns a random integer between 0 and n (inclusive).', params: [{ name: 'n', description: 'Upper bound (inclusive)' }], returns: 'Real' });
def({ name: 'irandom_range', signature: 'irandom_range(n1, n2)', description: 'Returns a random integer between n1 and n2 (inclusive).', params: [{ name: 'n1', description: 'Lower bound' }, { name: 'n2', description: 'Upper bound' }], returns: 'Real' });

// -- Strings --
def({ name: 'string', signature: 'string(val)', description: 'Converts a value to its string representation.', params: [{ name: 'val', description: 'The value to convert' }], returns: 'String' });
def({ name: 'string_length', signature: 'string_length(str)', description: 'Returns the number of characters in the string.', params: [{ name: 'str', description: 'The string' }], returns: 'Real' });
def({ name: 'string_pos', signature: 'string_pos(substr, str)', description: 'Returns the position of the first occurrence of substr in str, or 0 if not found.', params: [{ name: 'substr', description: 'Substring to find' }, { name: 'str', description: 'String to search in' }], returns: 'Real' });
def({ name: 'string_copy', signature: 'string_copy(str, index, count)', description: 'Returns a substring starting at index with the given count of characters.', params: [{ name: 'str', description: 'Source string' }, { name: 'index', description: 'Start position (1-based)' }, { name: 'count', description: 'Number of characters' }], returns: 'String' });
def({ name: 'string_upper', signature: 'string_upper(str)', description: 'Returns the string converted to uppercase.', params: [{ name: 'str', description: 'The string' }], returns: 'String' });
def({ name: 'string_lower', signature: 'string_lower(str)', description: 'Returns the string converted to lowercase.', params: [{ name: 'str', description: 'The string' }], returns: 'String' });
def({ name: 'string_concat', signature: 'string_concat(str1, str2, ...)', description: 'Concatenates multiple values into a single string.', params: [{ name: 'str1', description: 'First value' }, { name: 'str2', description: 'Second value' }], returns: 'String' });
def({ name: 'real', signature: 'real(val)', description: 'Converts a string or value to a real number.', params: [{ name: 'val', description: 'The value to convert' }], returns: 'Real' });

// -- Data Structures --
def({ name: 'array_length', signature: 'array_length(array)', description: 'Returns the length of the array.', params: [{ name: 'array', description: 'The array' }], returns: 'Real' });
def({ name: 'array_push', signature: 'array_push(array, val, ...)', description: 'Appends one or more values to the end of the array.', params: [{ name: 'array', description: 'The array' }, { name: 'val', description: 'Value to append' }], returns: 'void' });
def({ name: 'array_pop', signature: 'array_pop(array)', description: 'Removes and returns the last element of the array.', params: [{ name: 'array', description: 'The array' }], returns: 'Any' });
def({ name: 'array_sort', signature: 'array_sort(array, ascending)', description: 'Sorts the array in place.', params: [{ name: 'array', description: 'The array' }, { name: 'ascending', description: 'true for ascending, false for descending' }], returns: 'void' });
def({ name: 'ds_list_create', signature: 'ds_list_create()', description: 'Creates a new list data structure and returns its id.', params: [], returns: 'DS List' });
def({ name: 'ds_list_add', signature: 'ds_list_add(id, val, ...)', description: 'Adds one or more values to the end of the list.', params: [{ name: 'id', description: 'List id' }, { name: 'val', description: 'Value to add' }], returns: 'void' });
def({ name: 'ds_list_size', signature: 'ds_list_size(id)', description: 'Returns the number of entries in the list.', params: [{ name: 'id', description: 'List id' }], returns: 'Real' });
def({ name: 'ds_list_destroy', signature: 'ds_list_destroy(id)', description: 'Destroys the list and frees its memory.', params: [{ name: 'id', description: 'List id' }], returns: 'void' });
def({ name: 'ds_map_create', signature: 'ds_map_create()', description: 'Creates a new map data structure and returns its id.', params: [], returns: 'DS Map' });
def({ name: 'ds_map_add', signature: 'ds_map_add(id, key, val)', description: 'Adds a key-value pair to the map.', params: [{ name: 'id', description: 'Map id' }, { name: 'key', description: 'Key' }, { name: 'val', description: 'Value' }], returns: 'void' });
def({ name: 'ds_map_find_value', signature: 'ds_map_find_value(id, key)', description: 'Returns the value associated with the key, or undefined.', params: [{ name: 'id', description: 'Map id' }, { name: 'key', description: 'Key to look up' }], returns: 'Any' });
def({ name: 'ds_map_destroy', signature: 'ds_map_destroy(id)', description: 'Destroys the map and frees its memory.', params: [{ name: 'id', description: 'Map id' }], returns: 'void' });

// -- Drawing --
def({ name: 'draw_text', signature: 'draw_text(x, y, string)', description: 'Draws a text string at the given position.', params: [{ name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }, { name: 'string', description: 'Text to draw' }], returns: 'void' });
def({ name: 'draw_sprite', signature: 'draw_sprite(sprite, subimg, x, y)', description: 'Draws a sprite at the given position.', params: [{ name: 'sprite', description: 'Sprite index' }, { name: 'subimg', description: 'Sub-image index' }, { name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }], returns: 'void' });
def({ name: 'draw_rectangle', signature: 'draw_rectangle(x1, y1, x2, y2, outline)', description: 'Draws a rectangle.', params: [{ name: 'x1', description: 'Left X' }, { name: 'y1', description: 'Top Y' }, { name: 'x2', description: 'Right X' }, { name: 'y2', description: 'Bottom Y' }, { name: 'outline', description: 'true for outline only' }], returns: 'void' });
def({ name: 'draw_circle', signature: 'draw_circle(x, y, radius, outline)', description: 'Draws a circle.', params: [{ name: 'x', description: 'Center X' }, { name: 'y', description: 'Center Y' }, { name: 'radius', description: 'Radius' }, { name: 'outline', description: 'true for outline only' }], returns: 'void' });
def({ name: 'draw_set_colour', signature: 'draw_set_colour(col)', description: 'Sets the draw colour for subsequent draw calls.', params: [{ name: 'col', description: 'Colour value' }], returns: 'void' });
def({ name: 'draw_set_alpha', signature: 'draw_set_alpha(alpha)', description: 'Sets the draw alpha (transparency) for subsequent draw calls.', params: [{ name: 'alpha', description: 'Alpha value (0-1)' }], returns: 'void' });
def({ name: 'draw_set_font', signature: 'draw_set_font(font)', description: 'Sets the font used for drawing text.', params: [{ name: 'font', description: 'Font index' }], returns: 'void' });

// -- Instances --
def({ name: 'instance_create_depth', signature: 'instance_create_depth(x, y, depth, obj)', description: 'Creates a new instance of an object at the given position and depth.', params: [{ name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }, { name: 'depth', description: 'Depth layer' }, { name: 'obj', description: 'Object index' }], returns: 'Id.Instance' });
def({ name: 'instance_destroy', signature: 'instance_destroy()', description: 'Destroys the current instance.', params: [], returns: 'void' });
def({ name: 'instance_exists', signature: 'instance_exists(obj)', description: 'Returns whether any instance of the given object exists.', params: [{ name: 'obj', description: 'Object index or instance id' }], returns: 'Bool' });
def({ name: 'instance_number', signature: 'instance_number(obj)', description: 'Returns the number of instances of the given object.', params: [{ name: 'obj', description: 'Object index' }], returns: 'Real' });

// -- Input --
def({ name: 'keyboard_check', signature: 'keyboard_check(key)', description: 'Returns whether the given key is currently held down.', params: [{ name: 'key', description: 'Virtual key code' }], returns: 'Bool' });
def({ name: 'keyboard_check_pressed', signature: 'keyboard_check_pressed(key)', description: 'Returns whether the given key was just pressed this step.', params: [{ name: 'key', description: 'Virtual key code' }], returns: 'Bool' });
def({ name: 'mouse_check_button', signature: 'mouse_check_button(button)', description: 'Returns whether the given mouse button is currently held down.', params: [{ name: 'button', description: 'Mouse button constant (mb_left, mb_right, mb_middle)' }], returns: 'Bool' });

// -- Audio --
def({ name: 'audio_play_sound', signature: 'audio_play_sound(sound, priority, loop)', description: 'Plays a sound asset.', params: [{ name: 'sound', description: 'Sound index' }, { name: 'priority', description: 'Priority (higher = more important)' }, { name: 'loop', description: 'Whether to loop' }], returns: 'Id.Sound' });
def({ name: 'audio_stop_sound', signature: 'audio_stop_sound(sound)', description: 'Stops a playing sound.', params: [{ name: 'sound', description: 'Sound index or instance' }], returns: 'void' });

// -- Misc --
def({ name: 'show_debug_message', signature: 'show_debug_message(msg)', description: 'Outputs a message to the debug console.', params: [{ name: 'msg', description: 'Message to display' }], returns: 'void' });
def({ name: 'game_end', signature: 'game_end()', description: 'Ends the game.', params: [], returns: 'void' });
def({ name: 'room_goto', signature: 'room_goto(room)', description: 'Transitions to the specified room.', params: [{ name: 'room', description: 'Room index' }], returns: 'void' });
def({ name: 'room_goto_next', signature: 'room_goto_next()', description: 'Transitions to the next room in the room order.', params: [], returns: 'void' });
def({ name: 'point_distance', signature: 'point_distance(x1, y1, x2, y2)', description: 'Returns the distance between two points.', params: [{ name: 'x1', description: 'First X' }, { name: 'y1', description: 'First Y' }, { name: 'x2', description: 'Second X' }, { name: 'y2', description: 'Second Y' }], returns: 'Real' });
def({ name: 'point_direction', signature: 'point_direction(x1, y1, x2, y2)', description: 'Returns the direction (in degrees) from one point to another.', params: [{ name: 'x1', description: 'First X' }, { name: 'y1', description: 'First Y' }, { name: 'x2', description: 'Second X' }, { name: 'y2', description: 'Second Y' }], returns: 'Real' });
def({ name: 'place_meeting', signature: 'place_meeting(x, y, obj)', description: 'Returns whether the instance would collide with obj at the given position.', params: [{ name: 'x', description: 'X position to check' }, { name: 'y', description: 'Y position to check' }, { name: 'obj', description: 'Object index' }], returns: 'Bool' });
def({ name: 'move_towards_point', signature: 'move_towards_point(x, y, sp)', description: 'Sets the instance direction and speed to move towards a point.', params: [{ name: 'x', description: 'Target X' }, { name: 'y', description: 'Target Y' }, { name: 'sp', description: 'Speed' }], returns: 'void' });
def({ name: 'lengthdir_x', signature: 'lengthdir_x(len, dir)', description: 'Returns the horizontal component of a vector.', params: [{ name: 'len', description: 'Length' }, { name: 'dir', description: 'Direction in degrees' }], returns: 'Real' });
def({ name: 'lengthdir_y', signature: 'lengthdir_y(len, dir)', description: 'Returns the vertical component of a vector.', params: [{ name: 'len', description: 'Length' }, { name: 'dir', description: 'Direction in degrees' }], returns: 'Real' });


/**
 * Format a GML builtin for hover display as markdown.
 */
export function formatGmlHover(builtin: GmlBuiltin): string {
  const kindLabel = builtin.kind === 'function' ? '📦 GML Built-in Function'
    : builtin.kind === 'variable' ? '📦 GML Instance Variable'
    : builtin.kind === 'constant' ? '📦 GML Constant'
    : '📦 GML Keyword';

  let md = `${kindLabel}\n\n`;

  if (builtin.kind === 'function') {
    md += `\`\`\`gml\n${builtin.signature} → ${builtin.returns}\n\`\`\`\n\n`;
  } else if (builtin.kind === 'variable') {
    md += `\`\`\`gml\n${builtin.name} : ${builtin.returns}\n\`\`\`\n\n`;
  } else if (builtin.kind === 'constant') {
    md += `\`\`\`gml\n${builtin.name} : ${builtin.returns}\n\`\`\`\n\n`;
  } else {
    md += `\`\`\`gml\n${builtin.name}\n\`\`\`\n\n`;
  }

  md += builtin.description + '\n';

  if (builtin.params.length > 0) {
    md += '\n**Parameters:**\n';
    for (const p of builtin.params) {
      md += `- \`${p.name}\` — ${p.description}\n`;
    }
  }
  if (builtin.kind === 'function') {
    md += `\n**Returns:** \`${builtin.returns}\``;
  }
  return md;
}
