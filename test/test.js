/* eslint max-len: off, quotes:off, arrow-parens:off */
import test from 'ava';
import path from 'path';
import Handlebars from 'handlebars';
import TemplateResolver from '../lib/template-resolver.js';
import renderer from '../';

const rootDirectory = path.resolve(__dirname, '../');

/**
 * @param {function} tryCallback Callback
 * @returns {string} Error message
 */
function getErrorMessage(tryCallback) {
	try {
		tryCallback();
	} catch (e) {
		return e.message;
	}
	return undefined;
}

test('should resolve a full template path', async (t) => {
	const templateFile = TemplateResolver.resolveTemplatePath(
		'components/atoms/button/button.hbs', rootDirectory);
	const expectedFile = path.join(rootDirectory,
		'components', 'atoms', 'button', 'button.hbs');
	t.is(templateFile, expectedFile);
	t.pass();
});

test('should resolve an absolute template path', async (t) => {
	const templateFile = TemplateResolver.resolveTemplatePath(
		'/demo/components/atoms/button/button.hbs', rootDirectory);
	const expectedFile = path.resolve('/demo/components/atoms/button/button.hbs');
	t.is(templateFile, expectedFile);
	t.pass();
});

test('should resolve a template path missing the file name', async (t) => {
	const templateFile = TemplateResolver.resolveTemplatePath(
		'components/atoms/button', rootDirectory);
	const expectedFile = path.join(rootDirectory,
		'components', 'atoms', 'button', 'button.hbs');
	t.is(templateFile, expectedFile);
	t.pass();
});

test('should resolve a template from within a submodule', async (t) => {
	const templateFile = TemplateResolver.resolveTemplatePath(
		'~lodash/components/atoms/button', rootDirectory);
	const expectedFile = path.join(require.resolve('lodash'),
		'components', 'atoms', 'button', 'button.hbs');
	t.is(templateFile, expectedFile);
	t.pass();
});

test('should resolve a partial template path', async (t) => {
	const templateFile = TemplateResolver.resolveTemplatePath(
		'components/atoms/button/partial/button-text', rootDirectory);
	const expectedFile = path.join(rootDirectory,
		'components', 'atoms', 'button', 'partial', 'button-text', 'button-text.hbs');
	t.is(templateFile, expectedFile);
	t.pass();
});

test('should render a template path', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile('{{component "fixtures/demo-button"}}')({});
	const expectedHtml = '<button class="ux-a-button" >\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should check the schema for a template', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile(
		'{{component "fixtures/button"}}')({}));
	t.is(error, 'component (fixtures/button) with arguments: {"disabled":false,"full-width":false} failed because data should have required property \'color\'');
	t.pass();
});

test('should pass on a valid schema', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const html = Handlebars.compile('{{component "fixtures/button" color="teal"}}')({});
	const expectedHtml = '<button class="ux-a-button ux-a-button--teal" >\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should not check the schema for a template if `useSchema` is not set', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const error = getErrorMessage(() => Handlebars.compile(
		'{{component "fixtures/button"}}')({}));
	t.is(!error, true);
	t.pass();
});

test('should allow to pass a parameter to the template', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile(
		'{{component "fixtures/button" color="teal" full-width=true}}'
	)({});
	const expectedHtml = '<button class="ux-a-button ux-a-button--teal ux-a-button--full-width" >\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should allow to pass a child to the template', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile(
		'{{#component "fixtures/button" color="teal"}}Child{{/component}}'
	)({});
	const expectedHtml = '<button class="ux-a-button ux-a-button--teal" >\n  Child\n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should allow to pass an object to the template', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile(
		'{{component "fixtures/object-test" classes="[1,2]"}}'
	)({});
	const expectedHtml = '<button class="1 2 ">\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should throw on invalid objects arguments', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/object-test" classes="[1,2]]"}}')({}));
	const expectedError = 'component (fixtures/object-test) with arguments: {} failed because Invalid jsonic attribute for "fixtures/object-test": "classes"="[1,2]]" - Expected end of input but "]" found.';
	t.is(error, expectedError);
	t.pass();
});

test('should throw on incomplete schema definitions', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/incomplete-schema"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/incomplete-schema/pattern.json');
	const expectedError = `component (fixtures/incomplete-schema) with arguments: {} failed because Schema ${schemaFile} is missing a property definition`;
	t.is(error, expectedError);
	t.pass();
});

test('should throw on invalid schema definitions', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/invalid-schema"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/invalid-schema/pattern.json');
	const expectedError = `Failed to parse ${schemaFile} Unexpected token }`;
	t.is(error.indexOf(expectedError) !== -1, true);
	t.pass();
});

test('should throw on if the schema does not match the json schema standard', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/invalid-schema2"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/invalid-schema2/pattern.json');
	const expectedError = `component (fixtures/invalid-schema2) with arguments: {} failed because Error in ${schemaFile}: "data.properties['x'].type should be equal to one of the allowed values, data.properties['x'].type should be array, data.properties['x'].type should match some schema in anyOf"`;
	t.is(error, expectedError);
	t.pass();
});

test('should throw on missing schema definitions - if a schema is required', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/missing-schema"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/missing-schema/pattern.json');
	const expectedError = `component (fixtures/missing-schema) with arguments: {} failed because ENOENT: no such file or directory, open '${schemaFile}'`;
	t.is(error, expectedError);
	t.pass();
});

test('should not throw on missing schema definitions - if a schema is not required', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/missing-schema"}}')({}));
	const expectedError = undefined;
	t.is(error, expectedError);
	t.pass();
});

test('should allow to use a data file', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile(
		'{{component "fixtures/data-test" data-file="red.json"}}'
	)({});
	const expectedHtml = '<button class="red">\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should allow to use a data file without the .json extension', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile(
		'{{component "fixtures/data-test" data-file="red"}}'
	)({});
	const expectedHtml = '<button class="red">\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should throw if the data file contains json errors', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const error = getErrorMessage(() => Handlebars.compile(
		'{{component "fixtures/data-test" data-file="invalid"}}'
	)({}));
	const jsonFile = path.resolve(__dirname, 'fixtures/data-test/_data/invalid.json');
	const expectedError = `component (fixtures/data-test) with arguments: {} failed because Failed to parse "${jsonFile}" Expected end of input but "}" found.`;
	t.is(error, expectedError);
	t.pass();
});

test('should allow to use a data file with a subtemplate', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const html = Handlebars.compile(
		'{{component "fixtures/data-test/data-test.hbs" data-file="red"}}'
	)({});
	const expectedHtml = '<button class="red">\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should allow to specifiy required arguments', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const html = Handlebars.compile('{{component "fixtures/required" color="teal"}}')({});
	const expectedHtml = '<button class="ux-a-button ux-a-button--teal" >\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should allow to use arrays as values', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const html = Handlebars.compile('{{component "fixtures/array-test" colors="[\'black\', \'red\']"}}')({});
	const expectedHtml = '<button class="ux-a-button ux-a-button--black ux-a-button--red" >\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should allow to use arrays with shorthand values', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const html = Handlebars.compile('{{component "fixtures/array-test" colors="black"}}')({});
	const expectedHtml = '<button class="ux-a-button ux-a-button--black" >\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should tell the file name of the error source', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile(
		'{{component "fixtures/array-test"}}'
	)({ filepath: path.join(__dirname, 'test.hbs') }));
	const expectedError = `[test.hbs] - component (fixtures/array-test) with arguments: {"disabled":false} failed because data should have required property 'colors'`;
	t.is(error, expectedError);
	t.pass();
});

test('should tell the file name of the error source', async (t) => {
	const component = renderer({ rootDirectory: __dirname, useSchema: true });
	let error;
	component.on('error', (err) => { error = err; });
	Handlebars.registerHelper('component', component);
	getErrorMessage(() => Handlebars.compile(
		'{{component "fixtures/array-test"}}'
	)({ filepath: path.join(__dirname, 'test.hbs') }));
	const expectedError = `[test.hbs] - component (fixtures/array-test) with arguments: {"disabled":false} failed because data should have required property 'colors'`;
	t.is(error.message, expectedError);
	t.pass();
});

test('should pass if oneOf requirements are met', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile(
			'{{component "fixtures/one-of-test" id="test-id"}}'
		)({ filepath: path.join(__dirname, 'test.hbs') }));
	t.is(error, undefined);
	t.pass();
});

test('should pass if oneOf requirements are met', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, useSchema: true }));
	const error = getErrorMessage(() => Handlebars.compile(
			'{{component "fixtures/one-of-test" name="test-name"}}'
		)({ filepath: path.join(__dirname, 'test.hbs') }));
	t.is(error, undefined);
	t.pass();
});
