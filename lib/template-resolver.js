'use strict';
const _ = require('lodash');
const jsonic = require('jsonic');
const path = require('path');
const fs = require('fs');
const validJsonicWrappers = ['\'\'', '[]', '{}'];

/**
 * Parse an attribute containing a JSON like string (jsonic)
 * e.g. `{{component "x" size="['col-md-6', 'col-lg-6']"}}
 *
 * @param {*} attributeValue a component attribute value
 * @returns {*} parsed value
 */
function parseComponentAttribute(attributeValue) {
	// Parse only strings
	if (typeof attributeValue === 'string') {
		const wrapper = attributeValue.substr(0, 1) + attributeValue.substr(-1, 1);
		if (validJsonicWrappers.indexOf(wrapper) !== -1) {
			return jsonic(attributeValue);
		}
	}
	return attributeValue;
}

/**
 * Reads and parses the data file
 * @param {string} templateDirectory absolute path to the template
 * @param {string} dataName of the data file e.g. 'default.json' or 'default'
 * @returns {Object} content of the data file
 */
function readComponentRenderDataFromFile(templateDirectory, dataName) {
	const dataBasename = dataName.substr(-5) === '.json' ? dataName : `${dataName}.json`;
	const dataFile = path.join(templateDirectory, '_data', dataBasename);
	const dataContent = fs.readFileSync(dataFile).toString();
	try {
		return jsonic(dataContent);
	} catch (e) {
		e.message = `Failed to parse "${dataFile}" ${e.message}`;
		throw (e);
	}
}

/**
 * Returns the root directory for the given
 *
 * Resolves absolute, relative or node_module declarations:
 *
 * resolveTemplatePath('~module_name/x', '/demo/');
 *  -> '/demo/node_modules/module_name/x/x.hbs'
 *
 * resolveTemplatePath('x', '/demo/');
 *  -> '/demo/components/x/x.hbs'
 *
 * resolveTemplatePath('/z/x', '/demo/');
 *  -> '/z/components/x/x.hbs'
 *
 * @param {string} templatePath the template path to resolve
 * @param {string} moduleRootDirectory the fallback directory of the current module context
 * @returns {string} absolute url
 *
 */
function resolveTemplatePath(templatePath, moduleRootDirectory) {
	const templatePathParts = (/^(~([^\\\/]+)[\\\/]|)/).exec(templatePath);
	const nodeModule = templatePathParts[1];
	const baseFolder = templatePathParts[2];
	const resolvedRoot = nodeModule ? require.resolve(baseFolder) : moduleRootDirectory;
	// Join the path and the moduleRootDirectory
	const templateDirectory = path.resolve(resolvedRoot, templatePath.substr(nodeModule.length));
	const templateBaseName = path.basename(templateDirectory);
	// Turn components/atom/button into components/atom/button/button.hbs
	return templateBaseName.indexOf('.') >= 0
		? templateDirectory
		: path.join(templateDirectory, `${templateBaseName}.hbs`);
}

/**
 * Returns the render data of the component
 * @param {Object} componentInformation componentName, templateDirectory, handlebarsHelperContext
 * @returns {Object} Component render data
 */
function getComponentRenderData(componentInformation) {
	const componentName = componentInformation.componentName;
	const templateDirectory = componentInformation.templateDirectory;
	const handlebarsHelperContext = componentInformation.handlebarsHelperContext;
	const renderData = {};
	const componentAttributes = handlebarsHelperContext.hash;
	// Add data from file
	if (typeof(componentAttributes['data-file']) === 'string') {
		_.merge(renderData, readComponentRenderDataFromFile(templateDirectory, componentAttributes['data-file']));
		delete(componentAttributes['data-file']);
	}
	// Add parsed hash
	// e.g. the size of {{component "x" size="large"}}
	_.merge(renderData, _.mapValues(componentAttributes, (value, key) => {
		try {
			return parseComponentAttribute(value);
		} catch (e) {
			e.message = `Invalid jsonic attribute for "${componentName}": "${key}"="${value}" - ${e.message}`;
			throw (e);
		}
	}));
	// Add children property
	if (handlebarsHelperContext.fn) {
		renderData.children = handlebarsHelperContext.fn();
	}
	return renderData;
}


module.exports = {
	resolveTemplatePath,
	getComponentRenderData
};
