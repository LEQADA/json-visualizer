document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const renderBtn = document.getElementById('renderBtn');
    const formatBtn = document.getElementById('formatBtn'); // New button
    const minimizeBtn = document.getElementById('minimizeBtn'); // New button
    const treeContainer = document.getElementById('treeContainer');
    const errorMsg = document.getElementById('errorMsg');

    // --- Event Listeners ---

    formatBtn.addEventListener('click', () => {
        errorMsg.textContent = ''; // Clear errors
        const jsonString = jsonInput.value.trim();
        if (!jsonString) {
            errorMsg.textContent = 'Textarea is empty. Nothing to format.';
            return;
        }
        try {
            const jsonData = JSON.parse(jsonString);
            // Format: null replacer, 2 spaces indentation
            jsonInput.value = JSON.stringify(jsonData, null, 2);
        } catch (error) {
            console.error("JSON Formatting Error:", error);
            errorMsg.textContent = `Invalid JSON: Cannot format. ${error.message}`;
        }
    });

    minimizeBtn.addEventListener('click', () => {
        errorMsg.textContent = ''; // Clear errors
        const jsonString = jsonInput.value.trim();
         if (!jsonString) {
            errorMsg.textContent = 'Textarea is empty. Nothing to minify.';
            return;
        }
        try {
            const jsonData = JSON.parse(jsonString);
            // Minify: No extra arguments for stringify
            jsonInput.value = JSON.stringify(jsonData);
        } catch (error) {
            console.error("JSON Minifying Error:", error);
            errorMsg.textContent = `Invalid JSON: Cannot minify. ${error.message}`;
        }
    });

    renderBtn.addEventListener('click', () => {
        treeContainer.innerHTML = ''; // Clear previous tree
        errorMsg.textContent = '';   // Clear previous error
        treeContainer.classList.remove('tree'); // Remove tree class initially

        const jsonString = jsonInput.value.trim();
        if (!jsonString) {
            errorMsg.textContent = 'Textarea is empty. Nothing to visualize.';
            return;
        }

        try {
            const jsonData = JSON.parse(jsonString);
            treeContainer.classList.add('tree'); // Add class for styling
            const rootElement = buildTree(jsonData, 'root'); // Changed variable name slightly
            if (rootElement) {
                treeContainer.appendChild(rootElement);
            } else {
                // Handle cases where JSON is just a primitive at the root
                const primitiveDiv = document.createElement('div');
                 primitiveDiv.style.paddingLeft = '5px'; // Add some padding
                renderValue(primitiveDiv, jsonData);
                treeContainer.appendChild(primitiveDiv);
            }

        } catch (error) {
            console.error("JSON Parsing Error:", error);
            errorMsg.textContent = `Invalid JSON: Cannot visualize. ${error.message}`;
        }
    });

    // --- Helper Functions (Keep the existing buildTree, renderValue, toggleNode) ---

    /**
     * Recursively builds the HTML UL/LI structure for the JSON tree.
     * @param {*} data - The JSON data (object, array, or primitive).
     * @param {string} keyName - The key or index name for this node.
     * @param {boolean} isRoot - Flag if this is the initial call.
     * @returns {HTMLElement | null} - The UL element representing the node, or null for primitives that are root.
     */
    function buildTree(data, keyName, isRoot = true) {
        const type = typeof data;
        const isObject = type === 'object' && data !== null && !Array.isArray(data);
        const isArray = Array.isArray(data);

        if (isObject || isArray) {
            // Root element is a div container for the first level list
            const listContainer = isRoot ? document.createElement('div') : document.createElement('li');

            // If it's not the root, create the toggle and key structure inside the LI
            if (!isRoot) {
                const hasChildren = (isObject && Object.keys(data).length > 0) || (isArray && data.length > 0);
                if (hasChildren) {
                    const toggle = document.createElement('span');
                    toggle.classList.add('toggle');
                    toggle.textContent = '-'; // Default to expanded
                    toggle.onclick = toggleNode;
                    listContainer.appendChild(toggle);
                } else {
                    // Add placeholder for alignment if no children
                    const spacer = document.createElement('span');
                    spacer.style.display = 'inline-block';
                    spacer.style.width = '1em'; // Same width as toggle
                    spacer.style.marginRight = '5px';
                    listContainer.appendChild(spacer);
                }

                const keySpan = document.createElement('span');
                keySpan.classList.add('key');
                keySpan.textContent = `${keyName}:`;
                listContainer.appendChild(keySpan);
            }

            // Add Type Indicator ({} or [] or {} or []) and count
            const typeIndicator = document.createElement('span');
            typeIndicator.classList.add(isObject ? 'value-object' : 'value-array');
            const itemCount = isObject ? Object.keys(data).length : data.length;

            if (itemCount > 0) {
                 typeIndicator.textContent = isObject ? `{}` : `[]`; // Simpler indicator when children exist
            } else {
                 typeIndicator.textContent = isObject ? '{}' : '[]'; // Empty indicator
            }
            if (!isRoot) { // Only show indicator text next to key for non-root elements
                 listContainer.appendChild(typeIndicator);
            }

            // Create the UL that will hold the children
             const childUl = document.createElement('ul');
             let hasVisibleChildren = false;

             // Recursively build children
            if (isObject) {
                for (const key in data) {
                    if (Object.hasOwnProperty.call(data, key)) {
                        const childLi = buildTree(data[key], key, false); // isRoot is false for children
                        if (childLi) {
                            childUl.appendChild(childLi);
                            hasVisibleChildren = true;
                        }
                    }
                }
            } else { // isArray
                data.forEach((item, index) => {
                    const childLi = buildTree(item, `${index}`, false); // Use index as keyName (string)
                    if (childLi) {
                        childUl.appendChild(childLi);
                        hasVisibleChildren = true;
                    }
                });
            }

             // Append children UL only if it has content
            if (hasVisibleChildren) {
                 listContainer.appendChild(childUl);
            }

            return listContainer; // Return the LI or the root DIV

        } else {
            // Handle Primitive Values (string, number, boolean, null)
            if (isRoot) return null; // Cannot render a primitive as the only root element via buildTree

            const li = document.createElement('li');

             // Add placeholder for alignment with toggles on other lines
            const spacer = document.createElement('span');
            spacer.style.display = 'inline-block';
            spacer.style.width = '1em'; // Same width as toggle
            spacer.style.marginRight = '5px';
            li.appendChild(spacer);

             // Add Key Name
            const keySpan = document.createElement('span');
            keySpan.classList.add('key');
            keySpan.textContent = `${keyName}:`;
            li.appendChild(keySpan);

            // Add Value
            renderValue(li, data);

            return li;
        }
    }


    /**
     * Renders the primitive value with appropriate styling.
     * @param {HTMLElement} parentElement - The element to append the value span to.
     * @param {*} value - The primitive value.
     */
    function renderValue(parentElement, value) {
        const valueSpan = document.createElement('span');
        valueSpan.classList.add('value');
        const valueType = typeof value;

        if (value === null) {
            valueSpan.textContent = 'null';
            valueSpan.classList.add('value-null');
        } else if (valueType === 'string') {
            valueSpan.textContent = `"${value}"`; // Add quotes for strings
            valueSpan.classList.add('value-string');
        } else if (valueType === 'number') {
            valueSpan.textContent = value;
            valueSpan.classList.add('value-number');
        } else if (valueType === 'boolean') {
            valueSpan.textContent = value;
            valueSpan.classList.add('value-boolean');
        } else {
             valueSpan.textContent = String(value); // Fallback
        }
        parentElement.appendChild(valueSpan);
    }

    /**
     * Handles clicking the toggle [+] / [-] icons.
     * @param {Event} event - The click event.
     */
    function toggleNode(event) {
        const toggle = event.target;
        // Find the parent list item (LI) or the root container DIV
        const parentNode = toggle.closest('li, div');
        if (!parentNode) return;

        // Find the direct child UL within that parent node
        const childUl = parentNode.querySelector(':scope > ul');

        if (childUl) {
            const isCollapsed = parentNode.classList.toggle('collapsed');
            toggle.textContent = isCollapsed ? '+' : '-';
        }
         event.stopPropagation(); // Prevent event bubbling
    }
});
