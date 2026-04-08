import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	type RouteConfigEntry,
	index,
	route,
	layout,
} from '@react-router/dev/routes';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

type Tree = {
	path: string;
	children: Tree[];
	hasPage: boolean;
	hasLayout: boolean;
	isParam: boolean;
	paramName: string;
	isCatchAll: boolean;
	routeFile?: string;
};

function buildRouteTree(dir: string, basePath = ''): Tree {
	const files = readdirSync(dir);
	const node: Tree = {
		path: basePath,
		children: [],
		hasPage: false,
		hasLayout: false,
		isParam: false,
		isCatchAll: false,
		paramName: '',
	};

	// Check if the current directory name indicates a parameter
	const dirName = basePath.split('/').pop();
	if (dirName?.startsWith('[') && dirName.endsWith(']')) {
		node.isParam = true;
		const paramName = dirName.slice(1, -1);

		// Check if it's a catch-all parameter (e.g., [...ids])
		if (paramName.startsWith('...')) {
			node.isCatchAll = true;
			node.paramName = paramName.slice(3); // Remove the '...' prefix
		} else {
			node.paramName = paramName;
		}
	}

	for (const file of files) {
		const filePath = join(dir, file);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			const childPath = basePath ? `${basePath}/${file}` : file;
			const childNode = buildRouteTree(filePath, childPath);
			node.children.push(childNode);
		} else if (file === 'page.jsx') {
			node.hasPage = true;
		} else if (file === 'layout.jsx') {
			node.hasLayout = true;
		} else if (file === 'route.js' || file === 'route.ts') {
			node.routeFile = file;
		}
	}

	return node;
}

function generateRoutes(node: Tree): { uiRoutes: RouteConfigEntry[], resourceRoutes: RouteConfigEntry[] } {
	const uiRoutes: RouteConfigEntry[] = [];
	const resourceRoutes: RouteConfigEntry[] = [];

	// Handle Page
	if (node.hasPage) {
		const componentPath =
			node.path === '' ? `./${node.path}page.jsx` : `./${node.path}/page.jsx`;

		if (node.path === '') {
			uiRoutes.push(index(componentPath));
		} else {
			let routePath = node.path;
			const segments = routePath.split('/');
			const processedSegments = segments.map((segment) => {
				if (segment.startsWith('[') && segment.endsWith(']')) {
					const paramName = segment.slice(1, -1);
					if (paramName.startsWith('...')) return '*';
					return `:${paramName}`;
				}
				return segment;
			});
			routePath = processedSegments.join('/');
			uiRoutes.push(route(routePath, componentPath));
		}
	}

	// Handle API Route
	if (node.routeFile) {
		const componentPath =
			node.path === '' ? `./${node.path}${node.routeFile}` : `./${node.path}/${node.routeFile}`;

		let routePath = node.path;
		const segments = routePath.split('/');
		const processedSegments = segments.map((segment) => {
			if (segment.startsWith('[') && segment.endsWith(']')) {
				const paramName = segment.slice(1, -1);
				if (paramName.startsWith('...')) return '*';
				return `:${paramName}`;
			}
			return segment;
		});

		routePath = processedSegments.join('/');
		resourceRoutes.push(route(routePath, componentPath));
	}

	// Recursively collect children
	for (const child of node.children) {
		const { uiRoutes: childUi, resourceRoutes: childRes } = generateRoutes(child);
		uiRoutes.push(...childUi);
		resourceRoutes.push(...childRes);
	}

	// Wrap UI routes in layout if present (ONLY for UI routes, never API routes)
	if (node.hasLayout && node.path !== '') {
		const layoutPath = `./${node.path}/layout.jsx`;
		return {
			uiRoutes: [layout(layoutPath, uiRoutes)],
			resourceRoutes
		};
	}

	return { uiRoutes, resourceRoutes };
}

if (import.meta.env.DEV) {
	import.meta.glob('./**/page.jsx', {});
	import.meta.glob('./**/route.js', {});
	import.meta.glob('./**/route.ts', {});
	if (import.meta.hot) {
		import.meta.hot.accept((newSelf) => {
			import.meta.hot?.invalidate();
		});
	}
}

const tree = buildRouteTree(__dirname);
const notFound = route('*?', './__create/not-found.tsx');
const { uiRoutes, resourceRoutes } = generateRoutes(tree);
const routes = [...uiRoutes, ...resourceRoutes, notFound];

export default routes;
