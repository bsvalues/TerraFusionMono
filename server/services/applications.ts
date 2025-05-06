/**
 * Service for managing TerraFusion applications
 */
class ApplicationService {
  /**
   * Get all applications
   */
  async getApplications() {
    // In a real application, these would be fetched from a database
    // For now, we hard-code the applications from the monorepo
    return [
      { 
        id: 1,
        name: "terraagent", 
        displayName: "TerraAgent",
        description: "AI-driven assistant for property assessment",
        status: "active",
        version: "1.1.0",
        icon: "terminal",
        path: "/apps/terraagent"
      },
      { 
        id: 2,
        name: "terraf", 
        displayName: "TerraF",
        description: "Terraform-based infrastructure management",
        status: "active",
        version: "1.0.5",
        icon: "server",
        path: "/apps/terraf"
      },
      { 
        id: 3,
        name: "terraflow", 
        displayName: "TerraFlow",
        description: "Workflow automation for property data processing",
        status: "active",
        version: "1.2.3",
        icon: "workflow",
        path: "/apps/terraflow"
      },
      { 
        id: 4,
        name: "terrafusionpro", 
        displayName: "TerraFusion Pro",
        description: "Professional edition with advanced analytics",
        status: "active",
        version: "2.0.1",
        icon: "bar-chart",
        path: "/apps/terrafusionpro"
      },
      { 
        id: 5,
        name: "terrafusionsync",
        displayName: "TerraFusion Sync", 
        description: "Data synchronization service for field devices",
        status: "active",
        version: "0.9.5",
        icon: "refresh-cw",
        path: "/apps/terrafusionsync"
      },
      { 
        id: 6,
        name: "terralegislativepulsepub",
        displayName: "TerraLegislative Pulse", 
        description: "Legislative tracking and analysis service",
        status: "beta",
        version: "0.7.2",
        icon: "book",
        path: "/apps/terralegislativepulsepub"
      },
      { 
        id: 7,
        name: "terraminer",
        displayName: "TerraMiner", 
        description: "Data mining and pattern recognition for property data",
        status: "beta",
        version: "0.5.1",
        icon: "database",
        path: "/apps/terraminer"
      },
      { 
        id: 8,
        name: "core-gateway",
        displayName: "Core Gateway", 
        description: "Apollo Federation Gateway for microservices coordination",
        status: "active",
        version: "1.3.0",
        icon: "git-merge",
        path: "/apps/core-gateway"
      },
      { 
        id: 9,
        name: "marketplace-ui",
        displayName: "Marketplace UI", 
        description: "User interface for the plugin marketplace",
        status: "active",
        version: "1.0.0",
        icon: "shopping-cart",
        path: "/apps/marketplace-ui"
      },
      { 
        id: 10,
        name: "citizen-portal",
        displayName: "Citizen Portal", 
        description: "Public-facing portal for citizen access",
        status: "beta",
        version: "0.8.3",
        icon: "users",
        path: "/apps/citizen-portal"
      }
    ];
  }

  /**
   * Get a specific application by name
   */
  async getApplication(appName: string) {
    const apps = await this.getApplications();
    return apps.find(app => app.name === appName);
  }
}

export const applicationService = new ApplicationService();