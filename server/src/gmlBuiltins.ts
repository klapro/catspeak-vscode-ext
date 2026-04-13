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

// -- Dialog --
def({ name: 'show_message', signature: 'show_message(str)', description: 'Displays a pop-up message box with the given string and an OK button.', params: [{ name: 'str', description: 'Message to display' }], returns: 'void' });
def({ name: 'show_question', signature: 'show_question(str)', description: 'Displays a question dialog with OK and Cancel buttons. Returns true if OK is pressed.', params: [{ name: 'str', description: 'Question to display' }], returns: 'Bool' });

// -- Array Functions --
def({ name: 'array_create', signature: 'array_create(size, [val])', description: 'Creates a 1D array of the given size, optionally initialized to val (default 0).', params: [{ name: 'size', description: 'Length of the array' }, { name: 'val', description: 'Optional initial value for all elements' }], returns: 'Array' });
def({ name: 'array_copy', signature: 'array_copy(dest, dest_index, src, src_index, length)', description: 'Copies a range of values from one array to another.', params: [{ name: 'dest', description: 'Destination array' }, { name: 'dest_index', description: 'Start index in destination' }, { name: 'src', description: 'Source array' }, { name: 'src_index', description: 'Start index in source' }, { name: 'length', description: 'Number of elements to copy' }], returns: 'void' });
def({ name: 'array_equals', signature: 'array_equals(var1, var2)', description: 'Compares two arrays and returns whether they are equal.', params: [{ name: 'var1', description: 'First array' }, { name: 'var2', description: 'Second array' }], returns: 'Bool' });
def({ name: 'array_get', signature: 'array_get(array, index)', description: 'Returns the value at the given index in the array.', params: [{ name: 'array', description: 'The array' }, { name: 'index', description: 'Index to read' }], returns: 'Any' });
def({ name: 'array_set', signature: 'array_set(array, index, val)', description: 'Sets the value at the given index in the array.', params: [{ name: 'array', description: 'The array' }, { name: 'index', description: 'Index to write' }, { name: 'val', description: 'Value to set' }], returns: 'void' });
def({ name: 'array_insert', signature: 'array_insert(array, index, val, ...)', description: 'Inserts one or more values into the array at the given index.', params: [{ name: 'array', description: 'The array' }, { name: 'index', description: 'Index to insert at' }, { name: 'val', description: 'Value(s) to insert' }], returns: 'void' });
def({ name: 'array_delete', signature: 'array_delete(array, index, number)', description: 'Deletes one or more values from the array at the given index.', params: [{ name: 'array', description: 'The array' }, { name: 'index', description: 'Index to delete from' }, { name: 'number', description: 'Number of elements to delete' }], returns: 'void' });
def({ name: 'array_resize', signature: 'array_resize(array, new_size)', description: 'Resizes the array to the given length.', params: [{ name: 'array', description: 'The array' }, { name: 'new_size', description: 'New length' }], returns: 'void' });

// -- Method Functions --
def({ name: 'method', signature: 'method(instance, func)', description: 'Binds a function to an instance, returning a new method.', params: [{ name: 'instance', description: 'Instance or struct to bind to' }, { name: 'func', description: 'Function to bind' }], returns: 'Method' });
def({ name: 'method_get_self', signature: 'method_get_self(method)', description: 'Returns the instance or struct that a method is bound to.', params: [{ name: 'method', description: 'The method' }], returns: 'Id.Instance or Struct' });
def({ name: 'method_get_index', signature: 'method_get_index(method)', description: 'Returns the script function index of a method.', params: [{ name: 'method', description: 'The method' }], returns: 'Function' });

// -- Type Checking Functions --
def({ name: 'is_string', signature: 'is_string(val)', description: 'Returns whether the value is a string.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_real', signature: 'is_real(val)', description: 'Returns whether the value is a real number.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_numeric', signature: 'is_numeric(val)', description: 'Returns whether the value is numeric (real or int64).', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_bool', signature: 'is_bool(val)', description: 'Returns whether the value is a boolean.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_array', signature: 'is_array(val)', description: 'Returns whether the value is an array.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_struct', signature: 'is_struct(val)', description: 'Returns whether the value is a struct.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_method', signature: 'is_method(val)', description: 'Returns whether the value is a method.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_ptr', signature: 'is_ptr(val)', description: 'Returns whether the value is a pointer.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_int32', signature: 'is_int32(val)', description: 'Returns whether the value is a 32-bit integer.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_int64', signature: 'is_int64(val)', description: 'Returns whether the value is a 64-bit integer.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_vec3', signature: 'is_vec3(val)', description: 'Returns whether the value is a 3D vector.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_vec4', signature: 'is_vec4(val)', description: 'Returns whether the value is a 4D vector.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_matrix', signature: 'is_matrix(val)', description: 'Returns whether the value is a matrix.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_undefined', signature: 'is_undefined(val)', description: 'Returns whether the value is undefined.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_nan', signature: 'is_nan(val)', description: 'Returns whether the value is NaN (Not a Number).', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'is_infinity', signature: 'is_infinity(val)', description: 'Returns whether the value is infinity.', params: [{ name: 'val', description: 'Value to check' }], returns: 'Bool' });
def({ name: 'typeof', signature: 'typeof(val)', description: 'Returns a string describing the type of the value.', params: [{ name: 'val', description: 'Value to check' }], returns: 'String' });

// -- Type Conversion --
def({ name: 'bool', signature: 'bool(val)', description: 'Converts a value to a boolean.', params: [{ name: 'val', description: 'Value to convert' }], returns: 'Bool' });
def({ name: 'ptr', signature: 'ptr(val)', description: 'Converts a value to a pointer.', params: [{ name: 'val', description: 'Value to convert' }], returns: 'Pointer' });
def({ name: 'int64', signature: 'int64(val)', description: 'Converts a value to a 64-bit integer.', params: [{ name: 'val', description: 'Value to convert' }], returns: 'Int64' });

// -- Colour (American spelling aliases) --
def({ name: 'draw_set_color', signature: 'draw_set_color(col)', description: 'Sets the draw colour for subsequent draw calls. Alias for draw_set_colour.', params: [{ name: 'col', description: 'Colour value' }], returns: 'void' });
def({ name: 'make_color_rgb', signature: 'make_color_rgb(red, green, blue)', description: 'Creates a colour from red, green, and blue components (0-255). Alias for make_colour_rgb.', params: [{ name: 'red', description: 'Red component (0-255)' }, { name: 'green', description: 'Green component (0-255)' }, { name: 'blue', description: 'Blue component (0-255)' }], returns: 'Colour' });
def({ name: 'make_colour_rgb', signature: 'make_colour_rgb(red, green, blue)', description: 'Creates a colour from red, green, and blue components (0-255).', params: [{ name: 'red', description: 'Red component (0-255)' }, { name: 'green', description: 'Green component (0-255)' }, { name: 'blue', description: 'Blue component (0-255)' }], returns: 'Colour' });

// -- Window --
def({ name: 'window_get_width', signature: 'window_get_width()', description: 'Returns the width of the game window in pixels.', params: [], returns: 'Real' });
def({ name: 'window_get_height', signature: 'window_get_height()', description: 'Returns the height of the game window in pixels.', params: [], returns: 'Real' });
def({ name: 'window_get_x', signature: 'window_get_x()', description: 'Returns the x position of the game window.', params: [], returns: 'Real' });
def({ name: 'window_get_y', signature: 'window_get_y()', description: 'Returns the y position of the game window.', params: [], returns: 'Real' });

// -- Dialogs --
def({ name: 'show_message', signature: 'show_message(msg)', description: 'Displays a pop-up message box with the given string.', params: [{ name: 'msg', description: 'Message to display' }], returns: 'void' });
def({ name: 'show_question', signature: 'show_question(msg)', description: 'Shows a yes/no question dialog, returns true if yes.', params: [{ name: 'msg', description: 'Question to display' }], returns: 'Bool' });

// -- Arrays --
def({ name: 'array_create', signature: 'array_create(size, [val])', description: 'Creates a 1D array of the given size, optionally initialized to val.', params: [{ name: 'size', description: 'Size of the array' }, { name: 'val', description: 'Optional initial value' }], returns: 'Array' });
def({ name: 'array_delete', signature: 'array_delete(array, index, number)', description: 'Deletes value(s) from an array at the given position.', params: [{ name: 'array', description: 'The array' }, { name: 'index', description: 'Start index' }, { name: 'number', description: 'Number of elements to delete' }], returns: 'void' });

// -- Type Checking --
def({ name: 'is_undefined', signature: 'is_undefined(val)', description: 'Returns whether the given value is undefined.', params: [{ name: 'val', description: 'The value to check' }], returns: 'Bool' });

// -- Colour --
def({ name: 'make_color_rgb', signature: 'make_color_rgb(red, green, blue)', description: 'Creates a colour from RGB components (0-255 each).', params: [{ name: 'red', description: 'Red component (0-255)' }, { name: 'green', description: 'Green component (0-255)' }, { name: 'blue', description: 'Blue component (0-255)' }], returns: 'Colour' });

// -- Drawing (additional) --
def({ name: 'draw_set_color', signature: 'draw_set_color(col)', description: 'Sets the draw colour (American spelling alias of draw_set_colour).', params: [{ name: 'col', description: 'Colour value' }], returns: 'void' });
def({ name: 'draw_line', signature: 'draw_line(x1, y1, x2, y2)', description: 'Draws a line between two points.', params: [{ name: 'x1', description: 'Start X' }, { name: 'y1', description: 'Start Y' }, { name: 'x2', description: 'End X' }, { name: 'y2', description: 'End Y' }], returns: 'void' });
def({ name: 'draw_set_halign', signature: 'draw_set_halign(halign)', description: 'Sets horizontal text alignment.', params: [{ name: 'halign', description: 'Horizontal alignment constant' }], returns: 'void' });
def({ name: 'draw_set_valign', signature: 'draw_set_valign(valign)', description: 'Sets vertical text alignment.', params: [{ name: 'valign', description: 'Vertical alignment constant' }], returns: 'void' });
def({ name: 'draw_sprite_ext', signature: 'draw_sprite_ext(sprite, subimg, x, y, xscale, yscale, rot, colour, alpha)', description: 'Draws a sprite with extended options.', params: [{ name: 'sprite', description: 'Sprite index' }, { name: 'subimg', description: 'Sub-image index' }, { name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }, { name: 'xscale', description: 'Horizontal scale' }, { name: 'yscale', description: 'Vertical scale' }, { name: 'rot', description: 'Rotation angle' }, { name: 'colour', description: 'Blend colour' }, { name: 'alpha', description: 'Alpha transparency' }], returns: 'void' });

// -- Window --
def({ name: 'window_get_width', signature: 'window_get_width()', description: 'Returns the width of the game window in pixels.', params: [], returns: 'Real' });
def({ name: 'window_get_height', signature: 'window_get_height()', description: 'Returns the height of the game window in pixels.', params: [], returns: 'Real' });

// -- Instances (additional) --
def({ name: 'instance_create_layer', signature: 'instance_create_layer(x, y, layer, obj)', description: 'Creates a new instance on the given layer.', params: [{ name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }, { name: 'layer', description: 'Layer name or id' }, { name: 'obj', description: 'Object index' }], returns: 'Id.Instance' });

// -- Misc (additional) --
def({ name: 'choose', signature: 'choose(val1, val2, ...)', description: 'Returns a random value from the given arguments.', params: [{ name: 'val1', description: 'First value' }, { name: 'val2', description: 'Second value' }], returns: 'Any' });

// -- Strings (additional) --
def({ name: 'string_delete', signature: 'string_delete(str, index, count)', description: 'Deletes characters from a string.', params: [{ name: 'str', description: 'Source string' }, { name: 'index', description: 'Start position (1-based)' }, { name: 'count', description: 'Number of characters to delete' }], returns: 'String' });
def({ name: 'string_insert', signature: 'string_insert(substr, str, index)', description: 'Inserts a substring into a string.', params: [{ name: 'substr', description: 'Substring to insert' }, { name: 'str', description: 'Target string' }, { name: 'index', description: 'Position to insert at (1-based)' }], returns: 'String' });
def({ name: 'string_replace', signature: 'string_replace(str, old, new)', description: 'Replaces first occurrence of old with new.', params: [{ name: 'str', description: 'Source string' }, { name: 'old', description: 'Substring to find' }, { name: 'new', description: 'Replacement string' }], returns: 'String' });
def({ name: 'string_replace_all', signature: 'string_replace_all(str, old, new)', description: 'Replaces all occurrences of old with new.', params: [{ name: 'str', description: 'Source string' }, { name: 'old', description: 'Substring to find' }, { name: 'new', description: 'Replacement string' }], returns: 'String' });
def({ name: 'string_char_at', signature: 'string_char_at(str, index)', description: 'Returns the character at the given position.', params: [{ name: 'str', description: 'The string' }, { name: 'index', description: 'Position (1-based)' }], returns: 'String' });
def({ name: 'string_count', signature: 'string_count(substr, str)', description: 'Returns the number of occurrences of substr in str.', params: [{ name: 'substr', description: 'Substring to count' }, { name: 'str', description: 'String to search in' }], returns: 'Real' });

// -- Variable Access --
def({ name: 'variable_instance_exists', signature: 'variable_instance_exists(id, name)', description: 'Returns whether a variable exists on an instance.', params: [{ name: 'id', description: 'Instance id' }, { name: 'name', description: 'Variable name as string' }], returns: 'Bool' });
def({ name: 'variable_instance_get', signature: 'variable_instance_get(id, name)', description: 'Gets the value of a variable on an instance.', params: [{ name: 'id', description: 'Instance id' }, { name: 'name', description: 'Variable name as string' }], returns: 'Any' });
def({ name: 'variable_instance_set', signature: 'variable_instance_set(id, name, val)', description: 'Sets the value of a variable on an instance.', params: [{ name: 'id', description: 'Instance id' }, { name: 'name', description: 'Variable name as string' }, { name: 'val', description: 'Value to set' }], returns: 'void' });

// -- Sprites --
def({ name: 'sprite_get_width', signature: 'sprite_get_width(sprite)', description: 'Returns the width of a sprite.', params: [{ name: 'sprite', description: 'Sprite index' }], returns: 'Real' });
def({ name: 'sprite_get_height', signature: 'sprite_get_height(sprite)', description: 'Returns the height of a sprite.', params: [{ name: 'sprite', description: 'Sprite index' }], returns: 'Real' });

// -- Room/Game (additional) --
def({ name: 'room_goto_previous', signature: 'room_goto_previous()', description: 'Goes to the previous room.', params: [], returns: 'void' });
def({ name: 'game_restart', signature: 'game_restart()', description: 'Restarts the game.', params: [], returns: 'void' });
def({ name: 'room_restart', signature: 'room_restart()', description: 'Restarts the current room.', params: [], returns: 'void' });

// -- Alarms --
def({ name: 'alarm_get', signature: 'alarm_get(index)', description: 'Gets the value of an alarm.', params: [{ name: 'index', description: 'Alarm index (0-11)' }], returns: 'Real' });
def({ name: 'alarm_set', signature: 'alarm_set(index, value)', description: 'Sets the value of an alarm.', params: [{ name: 'index', description: 'Alarm index (0-11)' }, { name: 'value', description: 'Value to set' }], returns: 'void' });

// -- Effects --
def({ name: 'effect_create_above', signature: 'effect_create_above(kind, x, y, size, colour)', description: 'Creates a particle effect above instances.', params: [{ name: 'kind', description: 'Effect type' }, { name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }, { name: 'size', description: 'Effect size' }, { name: 'colour', description: 'Effect colour' }], returns: 'void' });
def({ name: 'effect_create_below', signature: 'effect_create_below(kind, x, y, size, colour)', description: 'Creates a particle effect below instances.', params: [{ name: 'kind', description: 'Effect type' }, { name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }, { name: 'size', description: 'Effect size' }, { name: 'colour', description: 'Effect colour' }], returns: 'void' });

// -- Motion --
def({ name: 'motion_add', signature: 'motion_add(dir, speed)', description: 'Adds motion to the instance.', params: [{ name: 'dir', description: 'Direction in degrees' }, { name: 'speed', description: 'Speed to add' }], returns: 'void' });
def({ name: 'move_wrap', signature: 'move_wrap(hor, vert, margin)', description: 'Wraps the instance around the room edges.', params: [{ name: 'hor', description: 'Wrap horizontally' }, { name: 'vert', description: 'Wrap vertically' }, { name: 'margin', description: 'Margin in pixels' }], returns: 'void' });
def({ name: 'move_and_collide', signature: 'move_and_collide(xspd, yspd, obj)', description: 'Moves and handles collision.', params: [{ name: 'xspd', description: 'Horizontal speed' }, { name: 'yspd', description: 'Vertical speed' }, { name: 'obj', description: 'Object to collide with' }], returns: 'Bool' });

// -- Collision --
def({ name: 'collision_rectangle', signature: 'collision_rectangle(x1, y1, x2, y2, obj, prec, notme)', description: 'Checks for collision in a rectangle.', params: [{ name: 'x1', description: 'Left X' }, { name: 'y1', description: 'Top Y' }, { name: 'x2', description: 'Right X' }, { name: 'y2', description: 'Bottom Y' }, { name: 'obj', description: 'Object index' }, { name: 'prec', description: 'Precise collision' }, { name: 'notme', description: 'Exclude self' }], returns: 'Id.Instance' });
def({ name: 'collision_circle', signature: 'collision_circle(x, y, radius, obj, prec, notme)', description: 'Checks for collision in a circle.', params: [{ name: 'x', description: 'Center X' }, { name: 'y', description: 'Center Y' }, { name: 'radius', description: 'Radius' }, { name: 'obj', description: 'Object index' }, { name: 'prec', description: 'Precise collision' }, { name: 'notme', description: 'Exclude self' }], returns: 'Id.Instance' });
def({ name: 'collision_line', signature: 'collision_line(x1, y1, x2, y2, obj, prec, notme)', description: 'Checks for collision along a line.', params: [{ name: 'x1', description: 'Start X' }, { name: 'y1', description: 'Start Y' }, { name: 'x2', description: 'End X' }, { name: 'y2', description: 'End Y' }, { name: 'obj', description: 'Object index' }, { name: 'prec', description: 'Precise collision' }, { name: 'notme', description: 'Exclude self' }], returns: 'Id.Instance' });

// -- Distance --
def({ name: 'distance_to_object', signature: 'distance_to_object(obj)', description: 'Returns distance to the nearest instance of obj.', params: [{ name: 'obj', description: 'Object index' }], returns: 'Real' });
def({ name: 'distance_to_point', signature: 'distance_to_point(x, y)', description: 'Returns distance to a point.', params: [{ name: 'x', description: 'X position' }, { name: 'y', description: 'Y position' }], returns: 'Real' });

// -- Math (additional) --
def({ name: 'dsin', signature: 'dsin(angle)', description: 'Returns sine of angle in degrees.', params: [{ name: 'angle', description: 'Angle in degrees' }], returns: 'Real' });
def({ name: 'dcos', signature: 'dcos(angle)', description: 'Returns cosine of angle in degrees.', params: [{ name: 'angle', description: 'Angle in degrees' }], returns: 'Real' });
def({ name: 'degtorad', signature: 'degtorad(deg)', description: 'Converts degrees to radians.', params: [{ name: 'deg', description: 'Angle in degrees' }], returns: 'Real' });
def({ name: 'radtodeg', signature: 'radtodeg(rad)', description: 'Converts radians to degrees.', params: [{ name: 'rad', description: 'Angle in radians' }], returns: 'Real' });
def({ name: 'log2', signature: 'log2(val)', description: 'Returns base-2 logarithm.', params: [{ name: 'val', description: 'The value' }], returns: 'Real' });
def({ name: 'log10', signature: 'log10(val)', description: 'Returns base-10 logarithm.', params: [{ name: 'val', description: 'The value' }], returns: 'Real' });
def({ name: 'ln', signature: 'ln(val)', description: 'Returns natural logarithm.', params: [{ name: 'val', description: 'The value' }], returns: 'Real' });
def({ name: 'exp', signature: 'exp(val)', description: 'Returns e raised to the power of val.', params: [{ name: 'val', description: 'The exponent' }], returns: 'Real' });
def({ name: 'sqr', signature: 'sqr(val)', description: 'Returns val squared.', params: [{ name: 'val', description: 'The value' }], returns: 'Real' });
def({ name: 'dot_product', signature: 'dot_product(x1, y1, x2, y2)', description: 'Returns the dot product of two vectors.', params: [{ name: 'x1', description: 'First vector X' }, { name: 'y1', description: 'First vector Y' }, { name: 'x2', description: 'Second vector X' }, { name: 'y2', description: 'Second vector Y' }], returns: 'Real' });

// -- Bulk GML built-in registration --
// These are all official GML functions. Functions already defined above with
// detailed descriptions are skipped (the Map won't overwrite them).
const BULK_GML_FUNCTIONS = [
  // Game
  'game_end','game_restart','game_load','game_load_buffer','game_save','game_save_buffer',
  'game_get_speed','game_set_speed',
  // Highscore
  'highscore_add','highscore_name','highscore_value','highscore_clear','draw_highscore',
  // Cursor
  'cursor_sprite',
  // DS general
  'ds_set_precision','ds_exists',
  // DS Grid
  'ds_grid_create','ds_grid_destroy','ds_grid_width','ds_grid_height','ds_grid_resize',
  'ds_grid_clear','ds_grid_set','ds_grid_set_disk','ds_grid_set_grid_region','ds_grid_set_region',
  'ds_grid_shuffle','ds_grid_sort','ds_grid_get','ds_grid_get_max','ds_grid_get_mean',
  'ds_grid_get_min','ds_grid_get_sum','ds_grid_get_disk_max','ds_grid_get_disk_mean',
  'ds_grid_get_disk_min','ds_grid_get_disk_sum','ds_grid_add','ds_grid_add_region',
  'ds_grid_add_disk','ds_grid_add_grid_region','ds_grid_multiply','ds_grid_multiply_disk',
  'ds_grid_multiply_region','ds_grid_multiply_grid_region','ds_grid_value_exists',
  'ds_grid_value_disk_exists','ds_grid_value_x','ds_grid_value_y','ds_grid_value_disk_x',
  'ds_grid_value_disk_y','ds_grid_copy','ds_grid_read','ds_grid_write',
  'ds_grid_to_mp_grid','mp_grid_to_ds_grid',
  // DS List (extras not already defined)
  'ds_list_clear','ds_list_empty','ds_list_set','ds_list_delete','ds_list_find_index',
  'ds_list_find_value','ds_list_insert','ds_list_replace','ds_list_shuffle','ds_list_sort',
  'ds_list_copy','ds_list_read','ds_list_write','ds_list_mark_as_list','ds_list_mark_as_map',
  'ds_list_is_list','ds_list_is_map',
  // DS Map (extras)
  'ds_map_exists','ds_map_clear','ds_map_copy','ds_map_replace','ds_map_delete','ds_map_empty',
  'ds_map_size','ds_map_find_first','ds_map_find_last','ds_map_find_next','ds_map_find_previous',
  'ds_map_keys_to_array','ds_map_values_to_array','ds_map_set','ds_map_read','ds_map_write',
  'ds_map_secure_save','ds_map_secure_save_buffer','ds_map_secure_load','ds_map_secure_load_buffer',
  'ds_map_add_list','ds_map_add_map','ds_map_replace_list','ds_map_replace_map',
  'ds_map_is_list','ds_map_is_map',
  // DS Priority
  'ds_priority_create','ds_priority_destroy','ds_priority_clear','ds_priority_empty',
  'ds_priority_size','ds_priority_add','ds_priority_change_priority','ds_priority_delete_max',
  'ds_priority_delete_min','ds_priority_delete_value','ds_priority_find_max','ds_priority_find_min',
  'ds_priority_find_priority','ds_priority_copy','ds_priority_read','ds_priority_write',
  // DS Queue
  'ds_queue_create','ds_queue_destroy','ds_queue_clear','ds_queue_empty','ds_queue_size',
  'ds_queue_dequeue','ds_queue_enqueue','ds_queue_head','ds_queue_tail','ds_queue_copy',
  'ds_queue_read','ds_queue_write',
  // DS Stack
  'ds_stack_create','ds_stack_destroy','ds_stack_clear','ds_stack_empty','ds_stack_size',
  'ds_stack_copy','ds_stack_top','ds_stack_pop','ds_stack_push','ds_stack_read','ds_stack_write',
  // Assets
  'asset_get_index','asset_get_type','tag_get_asset_ids','tag_get_assets','asset_get_tags',
  'asset_add_tags','asset_remove_tags','asset_has_tags','asset_has_any_tag','asset_clear_tags',
  // Animation Curves
  'animcurve_get','animcurve_get_channel_index','animcurve_get_channel','animcurve_channel_evaluate',
  'animcurve_create','animcurve_exists','animcurve_channel_new','animcurve_point_new','animcurve_destroy',
  // Sprites
  'sprite_get_name','sprite_get_number','sprite_get_speed','sprite_get_speed_type',
  'sprite_get_width','sprite_get_height','sprite_get_xoffset','sprite_get_yoffset',
  'sprite_get_bbox_bottom','sprite_get_bbox_left','sprite_get_bbox_right','sprite_get_bbox_top',
  'sprite_get_bbox_mode','sprite_get_nineslice','sprite_get_tpe','sprite_get_texture',
  'sprite_get_uvs','sprite_get_info','sprite_exists','sprite_add','sprite_replace',
  'sprite_duplicate','sprite_assign','sprite_merge','sprite_create_from_surface',
  'sprite_add_from_surface','sprite_collision_mask','sprite_nineslice_create',
  'sprite_set_nineslice','sprite_set_offset','sprite_set_bbox_mode','sprite_set_bbox',
  'sprite_set_speed','sprite_delete','sprite_set_alpha_from_sprite','sprite_set_cache_size',
  'sprite_set_cache_size_ext','sprite_save','sprite_save_strip','sprite_flush',
  'sprite_flush_multi','sprite_prefetch','sprite_prefetch_multi',
  // Skeleton
  'skeleton_animation_get','skeleton_animation_set','skeleton_animation_get_ext',
  'skeleton_animation_set_ext','skeleton_animation_get_duration','skeleton_animation_mix',
  'skeleton_animation_list','skeleton_animation_clear','skeleton_animation_get_frames',
  'skeleton_animation_get_frame','skeleton_animation_set_frame','skeleton_animation_get_position',
  'skeleton_animation_set_position','skeleton_animation_get_event_frames',
  'skeleton_animation_is_looping','skeleton_animation_is_finished',
  'skeleton_skin_create','skeleton_skin_get','skeleton_skin_set','skeleton_skin_list',
  'skeleton_attachment_get','skeleton_attachment_set','skeleton_attachment_create',
  'skeleton_attachment_create_colour','skeleton_bone_data_get','skeleton_bone_data_set',
  'skeleton_bone_state_get','skeleton_bone_state_set','skeleton_bone_list','skeleton_slot_list',
  'skeleton_slot_data','skeleton_slot_data_instance','skeleton_find_slot',
  'skeleton_slot_colour_set','skeleton_slot_colour_get','skeleton_slot_alpha_get',
  'skeleton_get_minmax','skeleton_get_num_bounds','skeleton_get_bounds',
  'skeleton_collision_draw_set','draw_skeleton','draw_skeleton_instance',
  'draw_skeleton_collision','draw_skeleton_time','draw_enable_skeleton_blendmodes',
  'draw_get_enable_skeleton_blendmodes',
  // Audio (extras)
  'audio_exists','audio_get_name','audio_get_type','audio_play_sound_at',
  'audio_pause_sound','audio_pause_all','audio_resume_sound','audio_resume_all',
  'audio_stop_all','audio_is_playing','audio_is_paused','audio_create_stream',
  'audio_destroy_stream','audio_sound_set_track_position','audio_sound_get_track_position',
  'audio_sound_set_listener_mask','audio_sound_get_listener_mask','audio_sound_length',
  'audio_sound_pitch','audio_sound_get_pitch','audio_sound_is_playable',
  'audio_falloff_set_model','audio_sound_gain','audio_sound_get_gain',
  'audio_master_gain','audio_set_master_gain','audio_get_master_gain',
  'audio_channel_num','audio_debug',
  // Paths
  'path_start','path_end','path_get_closed','path_get_kind','path_get_length',
  'path_get_name','path_get_number','path_get_point_speed','path_get_point_x',
  'path_get_point_y','path_get_precision','path_get_speed','path_get_x','path_get_y','draw_path',
];

// Register bulk functions — only if not already defined with a detailed entry
for (const name of BULK_GML_FUNCTIONS) {
  if (!GML_BUILTINS.has(name)) {
    GML_BUILTINS.set(name, {
      name,
      signature: `${name}(...)`,
      description: `GML built-in function.`,
      params: [],
      returns: 'Any',
      kind: 'function',
    });
  }
}


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
