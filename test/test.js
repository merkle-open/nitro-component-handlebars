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
	const expectedFile = '/demo/components/atoms/button/button.hbs';
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
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const error = getErrorMessage(() => Handlebars.compile(
		'{{component "fixtures/button"}}')({}));
	t.is(error, 'data should have required property \'color\'');
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
	const expectedError = 'Invalid jsonic attribute for "fixtures/object-test": "classes"="[1,2]]" - Expected end of input but "]" found.';
	t.is(error, expectedError);
	t.pass();
});

test('should throw on incomplete schema definitions', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, schemaRequired: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/incomplete-schema"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/incomplete-schema/pattern.json');
	const expectedError = `Schema ${schemaFile} is missing a property definition`;
	t.is(error, expectedError);
	t.pass();
});

test('should throw on invalid schema definitions', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, schemaRequired: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/invalid-schema"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/invalid-schema/pattern.json');
	const expectedError = `Failed to parse ${schemaFile} Unexpected token }`;
	t.is(error, expectedError);
	t.pass();
});

test('should throw on if the schema does not match the json schema standard', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, schemaRequired: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/invalid-schema2"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/invalid-schema2/pattern.json');
	const expectedError = `Error in ${schemaFile}: "data.properties['x'].type should be equal to one of the allowed values, data.properties['x'].type should be array, data.properties['x'].type should match some schema in anyOf"`;
	t.is(error, expectedError);
	t.pass();
});

test('should throw on missing schema definitions - if a schema is required', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname, schemaRequired: true }));
	const error = getErrorMessage(() => Handlebars.compile('{{component "fixtures/missing-schema"}}')({}));
	const schemaFile = path.resolve(__dirname, 'fixtures/missing-schema/pattern.json');
	const expectedError = `ENOENT: no such file or directory, open '${schemaFile}'`;
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

test('should allow to use a data file', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const error = getErrorMessage(() => Handlebars.compile(
		'{{component "fixtures/data-test" data-file="invalid"}}'
	)({}));
	const jsonFile = path.resolve(__dirname, 'fixtures/data-test/_data/invalid.json');
	const expectedError = `Failed to parse "${jsonFile}" Expected end of input but "}" found.`;
	t.is(error, expectedError);
	t.pass();
});

test('should allow to use a data file with a subtemplate', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile(
		'{{component "fixtures/data-test/data-test.hbs" data-file="red"}}'
	)({});
	const expectedHtml = '<button class="red">\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

test('should allow to specifiy required arguments', async (t) => {
	Handlebars.registerHelper('component', renderer({ rootDirectory: __dirname }));
	const html = Handlebars.compile('{{component "fixtures/required" color="teal"}}')({});
	const expectedHtml = '<button class="ux-a-button ux-a-button--teal" >\n  \n</button>\n';
	t.is(html, expectedHtml);
	t.pass();
});

