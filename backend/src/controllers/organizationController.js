const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create Organization
const createOrganization = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Organization name is required",
                data: {}
            });
        }

        const organization = await prisma.organizations.create({
            data: {
                name,
                description,
                owner_id: req.user.id
            }
        });

        res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: { organization }
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

// Get All Organizations
const getOrganizations = async (req, res) => {
    try {
        const organizations = await prisma.organizations.findMany({
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: "Organizations retrieved successfully",
            data: { organizations }
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

// Get Organization By ID
const getOrganizationById = async (req, res) => {
    try {
        const organization = await prisma.organizations.findUnique({
            where: {
                id: BigInt(req.params.id)
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true
                    }
                }
            }
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
                data: {}
            });
        }

        res.json({
            success: true,
            message: "Organization retrieved successfully",
            data: { organization }
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

// Update Organization
const updateOrganization = async (req, res) => {
    try {
        const { name, description } = req.body;

        const organization = await prisma.organizations.update({
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
            message: "Organization updated successfully",
            data: { organization }
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

// Delete Organization
const deleteOrganization = async (req, res) => {
    try {
        await prisma.organizations.delete({
            where: {
                id: BigInt(req.params.id)
            }
        });

        res.json({
            success: true,
            message: "Organization deleted successfully",
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
    createOrganization,
    getOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization
};