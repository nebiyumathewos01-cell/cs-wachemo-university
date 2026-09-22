"""
CS Wachemo University — FastAPI Backend
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed initial data."""
    # Import all models so SQLAlchemy can create tables
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Ensure upload directories exist
    Path(settings.UPLOAD_DIR + "/materials").mkdir(parents=True, exist_ok=True)
    Path(settings.UPLOAD_DIR + "/past_exams").mkdir(parents=True, exist_ok=True)

    # Seed initial data
    _seed_database()

    yield
    # Cleanup (none needed for now)


def _seed_database() -> None:
    """Seed academic years, semesters, and admin user on first run or ensure updated."""
    from app.models.user import User, UserRole
    from app.models.academic import AcademicYear, Semester
    from app.core.security import hash_password
    from sqlalchemy import text

    db = SessionLocal()
    try:
        # Check if username and payment columns exist in users table, add if missing
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);"))
            db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;"))
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';"))
            db.commit()
        except Exception as col_err:
            db.rollback()
            print(f"[DB MIGRATION NOTE] {col_err}")

        # Ensure admin user with Neba / CS3RD exists and is up to date
        admin = db.query(User).filter(
            (User.role == UserRole.admin) | (User.email == settings.ADMIN_EMAIL.lower()) | (User.username == "Neba")
        ).first()

        if not admin:
            admin = User(
                full_name=settings.ADMIN_FULL_NAME,
                username="Neba",
                email=settings.ADMIN_EMAIL.lower(),
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.admin,
                is_active=True,
                is_paid=True,
                payment_status="approved",
            )
            db.add(admin)
            db.flush()
            print(f"[SEED] Admin created: username=Neba, email={settings.ADMIN_EMAIL}")
        else:
            # Update admin credentials to Neba / CS3RD
            admin.username = "Neba"
            admin.email = settings.ADMIN_EMAIL.lower()
            admin.full_name = settings.ADMIN_FULL_NAME
            admin.hashed_password = hash_password(settings.ADMIN_PASSWORD)
            admin.role = UserRole.admin
            admin.is_active = True
            admin.is_paid = True
            admin.payment_status = "approved"
            db.flush()
            print(f"[SEED] Admin updated: username=Neba, email={settings.ADMIN_EMAIL}, password=CS3RD")

        # Seed academic years and official Wachemo CS curriculum if needed
        years_map_db = {}
        for y_data in [
            {"name": "2nd Year", "order": 1, "is_available": True},
            {"name": "3rd Year", "order": 2, "is_available": True},
            {"name": "4th Year", "order": 3, "is_available": False},
        ]:
            y_obj = db.query(AcademicYear).filter(AcademicYear.name == y_data["name"]).first()
            if not y_obj:
                y_obj = AcademicYear(**y_data)
                db.add(y_obj)
                db.flush()
            years_map_db[y_data["name"]] = y_obj

        # Ensure Semesters exist
        sem_map_db = {}
        for y_name, y_obj in years_map_db.items():
            for s_name, s_order in [("Semester I", 1), ("Semester II", 2)]:
                s_obj = db.query(Semester).filter(
                    Semester.academic_year_id == y_obj.id,
                    Semester.name == s_name
                ).first()
                if not s_obj:
                    s_obj = Semester(name=s_name, order=s_order, academic_year_id=y_obj.id)
                    db.add(s_obj)
                    db.flush()
                sem_map_db[f"{y_name}_{s_name}"] = s_obj

        # Official Wachemo CS Curriculum Courses
        wachemo_courses = [
            # 2nd Year - 1st Semester
            {"name": "Linear Algebra", "code": "MATH201", "year": "2nd Year", "sem": "Semester I", "desc": "Systems of linear equations, matrices, determinants, vector spaces, and eigenvalues."},
            {"name": "Fundamentals of Programming", "code": "COSC201", "year": "2nd Year", "sem": "Semester I", "desc": "C++ programming fundamentals, control structures, functions, arrays, and pointers."},
            {"name": "Fundamentals of Database Systems", "code": "COSC203", "year": "2nd Year", "sem": "Semester I", "desc": "Relational data model, SQL, entity-relationship modeling, and normalization."},
            {"name": "Digital Logic Design", "code": "COSC205", "year": "2nd Year", "sem": "Semester I", "desc": "Boolean algebra, combinational circuits, sequential circuits, registers, and counters."},
            {"name": "Probability and Statistics", "code": "STAT201", "year": "2nd Year", "sem": "Semester I", "desc": "Probability theory, random variables, statistical distributions, and hypothesis testing."},
            {"name": "Inclusiveness", "code": "SNIE201", "year": "2nd Year", "sem": "Semester I", "desc": "Inclusive education principles, diversity, and accessibility in higher education."},
            {"name": "Introduction to Economics", "code": "ECON201", "year": "2nd Year", "sem": "Semester I", "desc": "Microeconomics and macroeconomics concepts and principles for technology."},

            # 2nd Year - 2nd Semester
            {"name": "Data Structures and Algorithms", "code": "COSC202", "year": "2nd Year", "sem": "Semester II", "desc": "Stacks, queues, linked lists, trees, graphs, sorting, and searching algorithms."},
            {"name": "Advanced Database Systems", "code": "COSC204", "year": "2nd Year", "sem": "Semester II", "desc": "Query optimization, transaction management, concurrency control, NoSQL, and indexing."},
            {"name": "Computer Organization and Architecture", "code": "COSC206", "year": "2nd Year", "sem": "Semester II", "desc": "Instruction set architecture, CPU design, memory hierarchy, and I/O systems."},
            {"name": "Discrete Mathematics", "code": "MATH202", "year": "2nd Year", "sem": "Semester II", "desc": "Propositional logic, set theory, functions, relations, graphs, and trees."},
            {"name": "Computer Networking", "code": "COSC208", "year": "2nd Year", "sem": "Semester II", "desc": "OSI & TCP/IP models, network protocols, routing, switching, IP addressing, and LANs."},
            {"name": "Object Oriented Programming", "code": "COSC210", "year": "2nd Year", "sem": "Semester II", "desc": "OOP paradigms in Java, classes, inheritance, polymorphism, encapsulation, and exceptions."},

            # 3rd Year - 1st Semester
            {"name": "Advanced Java Programming", "code": "COSC301", "year": "3rd Year", "sem": "Semester I", "desc": "Java GUI, multithreading, socket programming, JDBC database connectivity, and Java EE."},
            {"name": "Operating Systems", "code": "COSC303", "year": "3rd Year", "sem": "Semester I", "desc": "Process management, CPU scheduling, synchronization, deadlocks, and virtual memory."},
            {"name": "Automata and Complexity Theory", "code": "COSC305", "year": "3rd Year", "sem": "Semester I", "desc": "Finite automata, regular languages, context-free grammars, Turing machines, and P vs NP."},
            {"name": "Global Trends", "code": "GLTR301", "year": "3rd Year", "sem": "Semester I", "desc": "Contemporary global issues, international relations, and socioeconomic developments."},
            {"name": "Numerical Analysis", "code": "MATH301", "year": "3rd Year", "sem": "Semester I", "desc": "Root-finding algorithms, numerical linear algebra, interpolation, and numerical calculus."},
            {"name": "Microprocessing and Assembly Language", "code": "COSC307", "year": "3rd Year", "sem": "Semester I", "desc": "8086 microprocessor architecture, assembly programming, addressing modes, and interrupts."},
            {"name": "Software Engineering", "code": "COSC309", "year": "3rd Year", "sem": "Semester I", "desc": "SDLC methodologies, Agile, requirements analysis, UML modeling, and software testing."},

            # 3rd Year - 2nd Semester
            {"name": "Design and Analysis of Algorithms", "code": "COSC302", "year": "3rd Year", "sem": "Semester II", "desc": "Algorithm design paradigms, greedy techniques, divide & conquer, and dynamic programming."},
            {"name": "Introduction to Artificial Intelligence", "code": "COSC304", "year": "3rd Year", "sem": "Semester II", "desc": "Search algorithms, knowledge representation, expert systems, neural networks, and NLP."},
            {"name": "Wireless Communication and Mobile Computing", "code": "COSC306", "year": "3rd Year", "sem": "Semester II", "desc": "Wireless transmission, cellular architectures, Wi-Fi, mobility management, and mobile apps."},
            {"name": "Real-Time and Embedded Systems", "code": "COSC308", "year": "3rd Year", "sem": "Semester II", "desc": "Embedded hardware architectures, microcontroller programming, sensors, and RTOS."},
            {"name": "Computer Graphics", "code": "COSC310", "year": "3rd Year", "sem": "Semester II", "desc": "2D/3D transformations, rasterization, clipping, lighting, OpenGL, and rendering."},
            {"name": "Entrepreneurship and Business Development", "code": "MGMT302", "year": "3rd Year", "sem": "Semester II", "desc": "Innovation, business planning, tech startups, marketing, and venture financing."},
            {"name": "Industrial Practice", "code": "COSC312", "year": "3rd Year", "sem": "Semester II", "desc": "Practical industry internship and real-world software engineering practice."},
        ]

        from app.models.academic import Course, Chapter
        for c_info in wachemo_courses:
            y_obj = years_map_db.get(c_info["year"])
            s_obj = sem_map_db.get(f"{c_info['year']}_{c_info['sem']}")
            if y_obj and s_obj:
                existing_c = db.query(Course).filter(
                    (Course.name == c_info["name"]) | (Course.code == c_info["code"])
                ).first()
                if not existing_c:
                    existing_c = Course(
                        name=c_info["name"],
                        code=c_info["code"],
                        description=c_info["desc"],
                        academic_year_id=y_obj.id,
                        semester_id=s_obj.id,
                    )
                    db.add(existing_c)
                    db.flush()
                else:
                    # Update year and semester link to ensure 100% correct placement
                    existing_c.academic_year_id = y_obj.id
                    existing_c.semester_id = s_obj.id
                    db.flush()

        # Seed Standard Chapters for all courses
        COURSE_CHAPTERS = {
            "Linear Algebra": [
                (1, "Systems of Linear Equations & Matrices", "Matrices, operations, gaussian elimination, echelon forms."),
                (2, "Determinants & Matrix Inverses", "Properties of determinants, Cramer's rule, cofactor expansion."),
                (3, "Vector Spaces & Subspaces", "Vector spaces, subspaces, linear independence, basis and dimension."),
                (4, "Linear Transformations & Orthogonality", "Kernel, range, matrix representation, dot products, orthogonality."),
                (5, "Eigenvalues & Eigenvectors", "Characteristic equations, diagonalization, applications."),
            ],
            "Fundamentals of Programming": [
                (1, "Introduction to Programming & C++", "Algorithms, structure of C++ programs, variables, data types, I/O."),
                (2, "Control Structures & Decision Making", "if-else, switch, while, do-while, for loops, nested control."),
                (3, "Functions & Recursion", "Function definitions, parameters, return values, recursion, scopes."),
                (4, "Arrays, Strings & Vectors", "1D/2D arrays, character arrays, string class, vector operations."),
                (5, "Pointers & Dynamic Memory", "Pointer arithmetic, dynamic allocation (new/delete), references."),
            ],
            "Fundamentals of Database Systems": [
                (1, "Introduction to DBMS & Data Models", "Database architecture, schemas, instances, data independence."),
                (2, "Entity-Relationship (ER) Modeling", "ER diagrams, entities, attributes, relationships, enhanced ER."),
                (3, "Relational Model & Relational Algebra", "Relational constraints, schema mapping, relational algebra operations."),
                (4, "SQL (DDL, DML, DQL) & Constraints", "Queries, joins, aggregations, views, triggers, assertions."),
                (5, "Functional Dependencies & Normalization", "1NF, 2NF, 3NF, BCNF, lossless join decomposition."),
            ],
            "Digital Logic Design": [
                (1, "Number Systems & Boolean Algebra", "Binary, octal, hex arithmetic, Boolean theorems, logic gates."),
                (2, "Simplification & Karnaugh Maps (K-Maps)", "SOP, POS, 2/3/4-variable K-maps, don't care conditions."),
                (3, "Combinational Logic Circuits", "Adders, subtractors, encoders, decoders, multiplexers."),
                (4, "Sequential Circuits & Flip-Flops", "Latches, SR, JK, D, T flip-flops, state diagrams and tables."),
                (5, "Registers, Counters & Memory Units", "Shift registers, synchronous/asynchronous counters, RAM/ROM."),
            ],
            "Probability and Statistics": [
                (1, "Descriptive Statistics & Data Presentation", "Frequency distributions, central tendency, dispersion, graphs."),
                (2, "Probability Theory & Laws", "Sample spaces, conditional probability, Bayes' theorem, independence."),
                (3, "Random Variables & Distributions", "Discrete and continuous distributions: Binomial, Poisson, Normal."),
                (4, "Sampling Distributions & Estimation", "Central limit theorem, point and interval estimation, confidence intervals."),
                (5, "Hypothesis Testing & Regression", "Z-test, t-test, chi-square test, simple linear regression."),
            ],
            "Inclusiveness": [
                (1, "Concepts of Inclusion & Diversity", "Definitions, models of disability, human rights principles."),
                (2, "Special Needs & Diverse Learning", "Sensory, physical, cognitive diversities, universal design."),
                (3, "Assistive Technologies in Computer Science", "Screen readers, speech recognition, accessible software design."),
                (4, "Inclusive Educational Environments", "Classroom strategies, collaboration, removing physical & digital barriers."),
                (5, "Policy & Legal Frameworks", "National and international policies on inclusive education and accessibility."),
            ],
            "Introduction to Economics": [
                (1, "Foundations of Economics & Scarcity", "Opportunity cost, production possibilities, economic systems."),
                (2, "Demand, Supply & Market Equilibrium", "Law of demand/supply, elasticity, market price determination."),
                (3, "Theory of Production and Cost", "Short-run and long-run production, cost functions, economies of scale."),
                (4, "Market Structures & Competition", "Perfect competition, monopoly, monopolistic competition, oligopoly."),
                (5, "Macroeconomic Concepts & Tech Economy", "GDP, inflation, unemployment, fiscal policy, digital economics."),
            ],
            "Data Structures and Algorithms": [
                (1, "Algorithm Analysis & Asymptotic Notations", "Big-O, Big-Omega, Big-Theta, time and space complexity."),
                (2, "Linear Data Structures (Arrays, Linked Lists)", "Singly, doubly, circular linked lists, stacks and queues."),
                (3, "Trees & Binary Search Trees (BST)", "Tree traversals, BST operations, AVL trees, heaps."),
                (4, "Graphs & Graph Algorithms", "Representations, BFS, DFS, Dijkstra, Prim's and Kruskal's."),
                (5, "Sorting & Searching Algorithms", "QuickSort, MergeSort, HeapSort, Binary Search, hashing."),
            ],
            "Advanced Database Systems": [
                (1, "Query Processing & Optimization", "Query translation, cost estimation, evaluation algorithms, indexing."),
                (2, "Transaction Management & ACID Properties", "Schedules, serializability, recoverability, transaction states."),
                (3, "Concurrency Control Techniques", "2-Phase Locking (2PL), timestamp ordering, deadlock handling."),
                (4, "Database Recovery & Fault Tolerance", "Write-ahead logging, check-pointing, shadow paging, media failure."),
                (5, "NoSQL & Distributed Databases", "CAP theorem, MongoDB, key-value stores, graph databases, replication."),
            ],
            "Computer Organization and Architecture": [
                (1, "Computer Systems & Performance", "History, von Neumann architecture, Moore's law, performance metrics."),
                (2, "Instruction Set Architecture (ISA)", "Addressing modes, instruction formats, RISC vs CISC."),
                (3, "Computer Arithmetic & ALU Design", "Integer arithmetic, booth's algorithm, IEEE 754 floating-point."),
                (4, "Processor Organization & Pipelining", "Datapath, control unit, pipeline hazards, branch prediction."),
                (5, "Memory Hierarchy & I/O Organization", "Cache memory mapping, virtual memory, DMA, interrupts."),
            ],
            "Discrete Mathematics": [
                (1, "Propositional & Predicate Logic", "Truth tables, logical equivalences, quantifiers, inference rules."),
                (2, "Sets, Functions & Relations", "Set operations, cardinality, equivalence relations, partial orders."),
                (3, "Proof Techniques & Mathematical Induction", "Direct proof, contraposition, contradiction, strong induction."),
                (4, "Counting, Permutations & Combinations", "Pigeonhole principle, binomial theorem, recurrence relations."),
                (5, "Graph Theory & Trees", "Euler & Hamiltonian paths, trees, spanning trees, graph coloring."),
            ],
            "Computer Networking": [
                (1, "Introduction to Networking & OSI/TCP Models", "Network topologies, layered architectures, packet switching."),
                (2, "Application Layer Protocols", "HTTP, DNS, SMTP, FTP, socket programming basics."),
                (3, "Transport Layer (TCP & UDP)", "Port numbers, multiplexing, flow control, congestion control."),
                (4, "Network Layer & IP Addressing", "IPv4, IPv6, subnetting, CIDR, routing algorithms (OSPF, BGP)."),
                (5, "Data Link & Physical Layer", "Framing, error detection (CRC), MAC protocols, Ethernet, ARP."),
            ],
            "Object Oriented Programming": [
                (1, "OOP Concepts & Java Fundamentals", "Classes, objects, constructors, JVM, garbage collection."),
                (2, "Encapsulation & Access Modifiers", "Information hiding, getters/setters, packages."),
                (3, "Inheritance & Polymorphism", "Method overriding, overloading, abstract classes, interfaces."),
                (4, "Exception Handling & File I/O", "try-catch-finally, custom exceptions, byte and character streams."),
                (5, "Java Collections Framework & Generics", "Lists, Sets, Maps, Iterators, GUI programming basics."),
            ],
            "Advanced Java Programming": [
                (1, "GUI Development with Swing & JavaFX", "Layout managers, event handling, MVC architecture."),
                (2, "Multithreading & Concurrency in Java", "Thread lifecycle, synchronization, locks, thread pools."),
                (3, "Database Connectivity (JDBC)", "Driver managers, connections, Statements, PreparedStatements, transactions."),
                (4, "Java Network Programming", "Client-Server architecture, Sockets, ServerSockets, HTTP clients."),
                (5, "Java Enterprise & Web Technologies", "Servlets, JSP, RESTful APIs, Spring Boot introduction."),
            ],
            "Operating Systems": [
                (1, "Introduction to Operating Systems", "OS functions, dual-mode operation, system calls, OS structures."),
                (2, "Process Management & CPU Scheduling", "Processes, PCB, context switching, FCFS, SJF, Round Robin."),
                (3, "Process Synchronization & Deadlocks", "Critical section problem, semaphores, mutex, Banker's algorithm."),
                (4, "Memory Management & Virtual Memory", "Paging, segmentation, page fault handling, page replacement (LRU)."),
                (5, "Storage, File Systems & Protection", "Directory structures, disk scheduling (SSTF, SCAN), access control."),
            ],
            "Automata and Complexity Theory": [
                (1, "Finite Automata (DFA & NFA)", "Deterministic and non-deterministic finite automata, NFA-to-DFA conversion."),
                (2, "Regular Expressions & Languages", "Pumping Lemma for regular languages, closure properties."),
                (3, "Context-Free Grammars & Pushdown Automata", "CFG derivation trees, ambiguity, Chomsky normal form, PDA."),
                (4, "Turing Machines & Computability", "Turing machine definition, multi-tape TMs, Church-Turing thesis, halting problem."),
                (5, "Computational Complexity (P vs NP)", "Time and space complexity classes, NP-completeness, Cook-Levin theorem."),
            ],
            "Global Trends": [
                (1, "Understanding Globalization", "Dimensions of globalization, historical evolution, drivers."),
                (2, "Contemporary Global Issues", "Global economy, geopolitics, international organizations (UN, AU)."),
                (3, "Technology, Society & Digital Divide", "Global IT trends, cybersecurity geopolitics, ethical challenges."),
                (4, "Global Environmental & Health Challenges", "Climate change, global pandemics, sustainable development goals."),
                (5, "Peace, Security & Conflict Resolution", "Global security threats, peacekeeping, international humanitarian law."),
            ],
            "Numerical Analysis": [
                (1, "Errors in Numerical Computations", "Truncation error, round-off error, error propagation."),
                (2, "Roots of Nonlinear Equations", "Bisection method, Regula-Falsi, Newton-Raphson, Secant method."),
                (3, "Numerical Linear Algebra", "Gauss elimination, Gauss-Jordan, LU decomposition, Gauss-Seidel."),
                (4, "Interpolation & Curve Fitting", "Lagrange polynomials, Newton's divided differences, least squares."),
                (5, "Numerical Differentiation & Integration", "Trapezoidal rule, Simpson's 1/3 and 3/8 rules, Runge-Kutta."),
            ],
            "Microprocessing and Assembly Language": [
                (1, "8086 Microprocessor Architecture", "Register organization, bus interface unit, execution unit, memory segmentation."),
                (2, "8086 Instruction Set & Assembly Basics", "Data transfer, arithmetic, logical, string, and control instructions."),
                (3, "Addressing Modes & Program Structure", "Immediate, direct, register, index, base-index addressing modes."),
                (4, "Procedures, Macros & Interrupts", "CALL/RET, stack operations, macros, BIOS and DOS interrupts (INT 21h)."),
                (5, "Hardware Interfacing & 8255 PPI", "I/O ports, memory interfacing, programmable peripheral interface."),
            ],
            "Software Engineering": [
                (1, "Software Process Models & Methodologies", "Waterfall, V-model, Spiral, Agile principles, Scrum & Kanban."),
                (2, "Requirements Engineering & Analysis", "Functional/non-functional requirements, user stories, use case modeling."),
                (3, "Software Design & UML Architecture", "Class diagrams, sequence diagrams, design patterns (Singleton, Factory)."),
                (4, "Software Testing & Quality Assurance", "Unit testing, integration testing, black-box, white-box, TDD."),
                (5, "Software Maintenance & DevOps", "Refactoring, version control, CI/CD pipelines, software evolution."),
            ],
            "Design and Analysis of Algorithms": [
                (1, "Advanced Algorithm Analysis", "Recurrence relations, master theorem, amortized analysis."),
                (2, "Divide and Conquer Paradigm", "MergeSort, QuickSort analysis, Strassen's matrix multiplication."),
                (3, "Greedy Algorithms", "Activity selection, Fractional knapsack, Huffman coding, minimum spanning trees."),
                (4, "Dynamic Programming", "0/1 Knapsack, Longest Common Subsequence (LCS), Matrix chain multiplication."),
                (5, "Backtracking, Branch & Bound, NP-Completeness", "N-Queens, Subset sum, TSP, P vs NP, polynomial reductions."),
            ],
            "Introduction to Artificial Intelligence": [
                (1, "Introduction to AI & Intelligent Agents", "Turing test, agent types, environments, rationality."),
                (2, "Search Algorithms & Heuristics", "BFS, DFS, Uniform-cost, A* search, minimax algorithm with alpha-beta."),
                (3, "Knowledge Representation & Logic", "Propositional logic, first-order logic, inference, ontologies."),
                (4, "Machine Learning Foundations", "Supervised, unsupervised, reinforcement learning, decision trees."),
                (5, "Neural Networks & Deep Learning Overview", "Perceptrons, backpropagation, CNNs, NLP overview."),
            ],
            "Wireless Communication and Mobile Computing": [
                (1, "Wireless Transmission Principles", "Electromagnetic spectrum, antennas, propagation models, modulation."),
                (2, "Cellular Networks (2G, 3G, 4G, 5G)", "Cell concepts, frequency reuse, handoff strategies, 5G architectures."),
                (3, "Wireless Local & Personal Area Networks", "IEEE 802.11 (Wi-Fi), Bluetooth, ZigBee, RFID."),
                (4, "Mobile Network & Transport Layers", "Mobile IP, dynamic host configuration, Mobile TCP issues."),
                (5, "Mobile Application Development & Security", "Mobile platforms, Android architecture, wireless security protocols."),
            ],
            "Real-Time and Embedded Systems": [
                (1, "Introduction to Embedded Systems", "Microcontrollers (ARM/AVR), hardware-software co-design, characteristics."),
                (2, "Embedded Programming & Interfacing", "GPIO, ADC, DAC, timers, PWM, serial communication (UART, SPI, I2C)."),
                (3, "Real-Time Operating Systems (RTOS)", "Hard vs soft real-time, RTOS tasks, scheduling (Rate Monotonic, EDF)."),
                (4, "Inter-Task Communication & Synchronization", "Queues, semaphores, mutexes, priority inversion, priority inheritance."),
                (5, "Embedded System Design & Optimization", "Power management, memory constraints, debugging, safety-critical design."),
            ],
            "Computer Graphics": [
                (1, "Introduction to Computer Graphics & Display Hardware", "Raster scan, vector refresh, color models (RGB, CMYK), OpenGL basics."),
                (2, "Rasterization & Line/Circle Drawing", "DDA algorithm, Bresenham's line and circle algorithms, polygon filling."),
                (3, "2D Geometric Transformations & Clipping", "Translation, rotation, scaling, Cohen-Sutherland line clipping."),
                (4, "3D Transformations & Projections", "3D matrices, perspective projection, parallel projection, viewports."),
                (5, "Illumination, Shading & Visible Surface Detection", "Phong lighting model, Gouraud shading, Z-buffer algorithm, ray tracing."),
            ],
            "Entrepreneurship and Business Development": [
                (1, "Entrepreneurship & Innovation in Technology", "Characteristics of entrepreneurs, tech startups, creative thinking."),
                (2, "Opportunity Identification & Market Research", "Idea generation, feasibility analysis, customer discovery."),
                (3, "Business Model Canvas & Tech Startup Planning", "Value proposition, revenue streams, cost structures, lean startup."),
                (4, "Marketing & Sales for Tech Ventures", "Digital marketing, product-market fit, sales funnels, branding."),
                (5, "Financing, Investment & Legal Aspects", "Bootstrapping, angel investors, venture capital, IP and patents."),
            ],
            "Industrial Practice": [
                (1, "Professional Ethics & Workplace Culture", "CS code of ethics, communication, teamwork, professional demeanor."),
                (2, "Industrial Software Development Practices", "Agile sprints, code repositories, issue tracking, stand-up meetings."),
                (3, "Code Review, Testing & Quality Standards", "Peer code reviews, automated CI/CD testing, documentation standards."),
                (4, "System Deployment, Monitoring & Maintenance", "Cloud hosting, dockerization, logging, incident response."),
                (5, "Internship Technical Reporting & Presentation", "Writing industrial reports, technical presentations, career readiness."),
            ],
        }

        all_courses = db.query(Course).all()
        for course in all_courses:
            existing_count = db.query(Chapter).filter(Chapter.course_id == course.id).count()
            if existing_count == 0:
                chapters_def = COURSE_CHAPTERS.get(course.name, [
                    (1, "Introduction & Fundamentals", f"Basic foundations and principles of {course.name}."),
                    (2, "Core Concepts & Architecture", f"Essential structures, models and paradigms in {course.name}."),
                    (3, "Advanced Methods & Techniques", f"In-depth analysis, design and problem solving in {course.name}."),
                    (4, "Practical Applications & Labs", f"Implementation and real-world application of {course.name}."),
                    (5, "System Integration & Review", f"Comprehensive review and examination preparation for {course.name}."),
                ])
                for num, title, desc in chapters_def:
                    ch = Chapter(
                        number=num,
                        title=title,
                        description=desc,
                        course_id=course.id,
                    )
                    db.add(ch)

        db.commit()
        print("[SEED] Wachemo CS curriculum courses and standard chapters seeded successfully")
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] {e}")
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="Educational platform for CS students at Wachemo University",
        lifespan=lifespan,
    )

    # CORS
    origins = settings.allowed_origins_list
    if "*" in origins or not origins:
        origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:.*|http://127\.0\.0\.1:.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routes
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Health check
    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "ok", "app": settings.APP_NAME}

    return app


app = create_app()
