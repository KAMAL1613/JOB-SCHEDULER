const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create Project
const createProject = async (req, res) => {
    try {
        const { organization_id, name, description } = req.body;

        if (!organization_id || !name) {
            return res.status(400).json({
                success: false,
                message: "Organization ID and Project name are required",
                data: {}
            });
        }

        // Verify organization exists
        const org = await prisma.organizations.findUnique({
            where: { id: BigInt(organization_id) }
        });

        if (!org) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
                data: {}
            });
        }

        const project = await prisma.projects.create({
            data: {
                name,
                description,
                organization_id: BigInt(organization_id)
            }
        });

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: { project }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Get All Projects (optionally filter by organization_id)
const getProjects = async (req, res) => {
    try {
        const { organization_id } = req.query;
        
        const filter = {};
        if (organization_id) {
            filter.organization_id = BigInt(organization_id);
        }

        const projects = await prisma.projects.findMany({
            where: filter,
            include: {
                organizations: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: "Projects retrieved successfully",
            data: { projects }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Get Project By ID
const getProjectById = async (req, res) => {
    try {
        const project = await prisma.projects.findUnique({
            where: {
                id: BigInt(req.params.id)
            },
            include: {
                organizations: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                queues: true
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
                data: {}
            });
        }

        res.json({
            success: true,
            message: "Project retrieved successfully",
            data: { project }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Update Project
const updateProject = async (req, res) => {
    try {
        const { name, description } = req.body;

        const project = await prisma.projects.update({
            where: {
                id: BigInt(req.params.id)
            },
            data: {
                name,
                description
            }
        });

        res.json({
            success: true,
            message: "Project updated successfully",
            data: { project }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

// Delete Project
const deleteProject = async (req, res) => {
    try {
        await prisma.projects.delete({
            where: {
                id: BigInt(req.params.id)
            }
        });

        res.json({
            success: true,
            message: "Project deleted successfully",
            data: {}
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
            data: {}
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
};
