document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const totalTasks = document.getElementById('total-tasks');
    const completedTasks = document.getElementById('completed-tasks');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const clearAllBtn = document.getElementById('clear-all');
    const allFilter = document.getElementById('all');
    const pendingFilter = document.getElementById('pending');
    const completedFilter = document.getElementById('completed');
    const themeSwitch = document.getElementById('theme-switch');
    const modal = document.getElementById('task-modal');
    const closeModal = document.querySelector('.close-modal');
    const saveTaskBtn = document.getElementById('save-task');
    const dueDateFeature = document.getElementById('due-date-feature');
    const priorityFeature = document.getElementById('priority-feature');
    const categoriesFeature = document.getElementById('categories-feature');
    const confettiContainer = document.getElementById('confetti-container');

    // Variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentEditingTaskId = null;

    // Initialize
    renderTasks();
    updateStats();
    checkThemePreference();

    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    clearAllBtn.addEventListener('click', clearAllTasks);
    allFilter.addEventListener('click', () => setFilter('all'));
    pendingFilter.addEventListener('click', () => setFilter('pending'));
    completedFilter.addEventListener('click', () => setFilter('completed'));
    themeSwitch.addEventListener('change', toggleTheme);
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    saveTaskBtn.addEventListener('click', saveTaskDetails);
    dueDateFeature.addEventListener('click', showTaskModal);
    priorityFeature.addEventListener('click', showTaskModal);
    categoriesFeature.addEventListener('click', showTaskModal);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Functions
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: 'medium',
            category: 'work',
            dueDate: '',
            notes: '',
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        taskInput.value = '';
        animateTaskAddition();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = tasks;
        if (currentFilter === 'pending') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }

        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = currentFilter === 'all' ? 'No tasks yet. Add one!' : 
                                     currentFilter === 'pending' ? 'No pending tasks!' : 
                                     'No completed tasks yet!';
            emptyMessage.classList.add('empty-message');
            taskList.appendChild(emptyMessage);
            return;
        }

        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.classList.add('task-item');
            if (task.completed) taskItem.classList.add('completed');
            taskItem.dataset.id = task.id;

            const priorityClass = `priority-${task.priority}`;
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-priority ${priorityClass}"></div>
                <span class="task-text">${task.text}</span>
                ${task.dueDate ? `<span class="task-due-date">${formatDate(task.dueDate)}</span>` : ''}
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;

            const checkbox = taskItem.querySelector('.task-checkbox');
            const editBtn = taskItem.querySelector('.edit-btn');
            const deleteBtn = taskItem.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            editBtn.addEventListener('click', () => editTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(taskItem);
        });
    }

    function toggleTaskComplete(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex === -1) return;

        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
        updateStats();

        if (tasks[taskIndex].completed) {
            animateTaskCompletion(id);
            if (tasks.filter(t => t.completed).length === 1) {
                showConfetti();
            }
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
        animateTaskDeletion(id);
    }

    function clearAllTasks() {
        if (tasks.length === 0 || !confirm('Are you sure you want to delete all tasks?')) return;
        
        tasks = [];
        saveTasks();
        renderTasks();
        updateStats();
    }

    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;

        currentEditingTaskId = id;
        document.getElementById('task-title').value = task.text;
        document.getElementById('task-due-date').value = task.dueDate;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-category').value = task.category;
        document.getElementById('task-notes').value = task.notes;

        modal.style.display = 'block';
    }

    function saveTaskDetails() {
        const title = document.getElementById('task-title').value.trim();
        if (title === '') return;

        const taskIndex = tasks.findIndex(task => task.id === currentEditingTaskId);
        if (taskIndex === -1) return;

        tasks[taskIndex] = {
            ...tasks[taskIndex],
            text: title,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value,
            notes: document.getElementById('task-notes').value
        };

        saveTasks();
        renderTasks();
        modal.style.display = 'none';
        currentEditingTaskId = null;
    }

    function showTaskModal() {
        if (taskInput.value.trim() === '') {
            alert('Please enter a task first!');
            taskInput.focus();
            return;
        }

        document.getElementById('task-title').value = taskInput.value.trim();
        document.getElementById('task-due-date').value = '';
        document.getElementById('task-priority').value = 'medium';
        document.getElementById('task-category').value = 'work';
        document.getElementById('task-notes').value = '';

        modal.style.display = 'block';
        currentEditingTaskId = null;
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        totalTasks.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
        completedTasks.textContent = `${completed} completed`;
        progressBar.innerHTML = `<div style="width: ${percentage}%"></div>`;
        progressText.textContent = `${percentage}%`;
    }

    function setFilter(filter) {
        currentFilter = filter;
        document.querySelectorAll('.filters span').forEach(span => {
            span.classList.toggle('active', span.id === filter);
        });
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function checkThemePreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            themeSwitch.checked = savedTheme === 'dark';
        } else if (prefersDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeSwitch.checked = true;
        }
    }

    function toggleTheme() {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function animateTaskAddition() {
        const firstTask = taskList.firstChild;
        if (firstTask) {
            firstTask.style.transform = 'scale(0.9)';
            firstTask.style.opacity = '0';
            setTimeout(() => {
                firstTask.style.transform = 'scale(1)';
                firstTask.style.opacity = '1';
            }, 10);
        }
    }

    function animateTaskCompletion(id) {
        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskElement) {
            taskElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                taskElement.style.transform = 'scale(1)';
            }, 300);
        }
    }

    function animateTaskDeletion(id) {
        const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskElement) {
            taskElement.style.transform = 'translateX(-100%)';
            taskElement.style.opacity = '0';
            setTimeout(() => {
                taskElement.remove();
            }, 300);
        }
    }

    function showConfetti() {
        // Clear any existing confetti
        confettiContainer.innerHTML = '';
        
        // Create new confetti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            
            // Random properties
            const size = Math.random() * 10 + 5;
            const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 3 + 2;
            
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.backgroundColor = color;
            confetti.style.left = `${left}%`;
            confetti.style.animationDuration = `${animationDuration}s`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            
            confettiContainer.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, animationDuration * 1000);
        }
    }
});