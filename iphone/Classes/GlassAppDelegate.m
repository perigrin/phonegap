#import "GlassAppDelegate.h"
#import "GlassViewController.h"
#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>

@implementation GlassAppDelegate

@synthesize window;
@synthesize viewController;

@synthesize lastKnownLocation;
@synthesize imagePickerController;

void alert(NSString *message) {
    UIAlertView *openURLAlert = [[UIAlertView alloc] initWithTitle:@"Alert" message:message delegate:nil cancelButtonTitle:@"OK" otherButtonTitles:nil];
    [openURLAlert show];
    [openURLAlert release];
}

- (void)applicationDidFinishLaunching:(UIApplication *)application {

    webView.delegate = self;

    // Set up the image picker controller and add it to the view
    imagePickerController = [[UIImagePickerController alloc] init];
    
    // Im not sure why the next line was giving me a warning... any ideas?
    // when this is commented out, the cancel button no longer works.
    imagePickerController.delegate = self;
    imagePickerController.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
    imagePickerController.view.hidden = YES;
    //[window addSubview:imagePickerController.view];
    
    [window addSubview:viewController.view]; 
    
    NSString *errorDesc = nil;
    
    NSPropertyListFormat format;
    NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"Settings" ofType:@"plist"];
    NSData *plistXML = [[NSFileManager defaultManager] contentsAtPath:plistPath];
    NSDictionary *temp = (NSDictionary *)[NSPropertyListSerialization
									      propertyListFromData:plistXML
									      mutabilityOption:NSPropertyListMutableContainersAndLeaves			  
									      format:&format errorDescription:&errorDesc];
    
    
    NSNumber *offline;
    NSString *url;
    NSNumber *detectNumber;
    NSNumber *useLocation;
    NSNumber *useAccellerometer;
    NSNumber *autoRotate;

    offline	          = [temp objectForKey:@"Offline"];
    url		          = [temp objectForKey:@"Callback"];
    detectNumber      = [temp objectForKey:@"DetectPhoneNumber"]; 
    useLocation	      = [temp objectForKey:@"UseLocation"]; 
    useAccellerometer = [temp objectForKey:@"UseAccellerometer"]; 
    autoRotate        = [temp objectForKey:@"AutoRotate"];

    if ([useLocation boolValue]) {
        locationManager = [[CLLocationManager alloc] init];
        locationManager.delegate = self;
        [locationManager startUpdatingLocation];
    }

    if ([useAccellerometer boolValue]) {
        [[UIAccelerometer sharedAccelerometer] setUpdateInterval:1.0/40.0];
        [[UIAccelerometer sharedAccelerometer] setDelegate:self];
    }
	    
    if ([offline boolValue] == NO) {
	    // Online Mode
	    appURL = [[NSURL URLWithString:url] retain];
	    NSURLRequest * aRequest = [NSURLRequest requestWithURL:appURL];
	    [webView loadRequest:aRequest];
    } else {		
	    // Offline Mode
	    NSString * urlPathString;
	    NSBundle * thisBundle = [NSBundle bundleForClass:[self class]];
	    if (urlPathString = [thisBundle pathForResource:@"index" ofType:@"html" inDirectory:@"www"]) {
		    [webView loadRequest:[NSURLRequest
		       requestWithURL:[NSURL fileURLWithPath:urlPathString]
		       cachePolicy:NSURLRequestUseProtocolCachePolicy
		       timeoutInterval:20.0
		       ]];
		    
	    }   
    }
    
    [viewController setAutoRotate:[autoRotate boolValue]];
    webView.detectsPhoneNumbers = [detectNumber boolValue];
    
    //This keeps the Default.png up
    imageView = [[UIImageView alloc] initWithImage:[[UIImage alloc] initWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"Default" ofType:@"png"]]];
    [window addSubview:imageView];

    activityView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
    [window addSubview:activityView];
    [activityView startAnimating];
    [window makeKeyAndVisible];

    //NSBundle * mainBundle = [NSBundle mainBundle];
}

//when web application loads pass it device information
- (void)webViewDidStartLoad:(UIWebView *)theWebView {
  [UIApplication sharedApplication].networkActivityIndicatorVisible = YES; 
  Device * device = [[Device alloc] init];
  [theWebView stringByEvaluatingJavaScriptFromString:[device getDeviceInfo]];
  [device release];
}

- (void)webViewDidFinishLoad:(UIWebView *)theWebView {
  imageView.hidden = YES;
  [UIApplication sharedApplication].networkActivityIndicatorVisible = NO; 
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error {
	if ([error code] != NSURLErrorCancelled)
		alert(error.localizedDescription);
}

- (BOOL)webView:(UIWebView *)theWebView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
	NSURL* url = [request URL];
	NSBundle * mainBundle = [NSBundle mainBundle];
	
	// Check to see if the URL request is for the App URL.
	// If it is not, then launch using Safari
	NSString* urlScheme = [url scheme];
	NSString* urlHost = [url host];
	NSString* appHost = [appURL host];

	if ([urlScheme isEqualToString:@"gap"]) {
		NSString* actionName = [url host];
		NSString* appPath = [(NSString *)[url path] substringFromIndex:1];
		NSArray* arguments = [appPath componentsSeparatedByString:@"/"];
		NSString * jsCallBack = nil;

		if ([actionName length] > 0) {
			
			if([actionName isEqualToString:@"getloc"]){
				NSLog(@"location request!");

				double lat = 0.0;
				double lon = 0.0;

				if (lastKnownLocation) {
					lat = lastKnownLocation.coordinate.latitude;
					lon = lastKnownLocation.coordinate.longitude;
				}

				jsCallBack = [[NSString alloc] initWithFormat:@"gotLocation('%f','%f');", lat, lon];
				NSLog(jsCallBack);
				[theWebView stringByEvaluatingJavaScriptFromString:jsCallBack];
				
				[jsCallBack release];
			}
                        
                        else if([actionName isEqualToString:@"consolelog"]){
				NSLog(@"[%@] %@", [arguments objectAtIndex:0], [arguments objectAtIndex:1]);
			}
                        
                        else if([actionName isEqualToString:@"getphoto"]){
				NSLog(@"Photo request!");
				NSLog([arguments objectAtIndex:0]);
			
				imagePickerController.view.hidden = NO;
				webView.hidden = YES;
				[window bringSubviewToFront:imagePickerController.view];
				NSLog(@"photo dialog open now!");
			}
                        
                        else if([actionName isEqualToString:@"vibrate"]){
				Vibrate *vibration = [[Vibrate alloc] init];
				[vibration vibrate];
				[vibration release];
			}
                        
                        else if([actionName isEqualToString:@"openmap"]) {
				NSString *mapurl = [@"maps:" stringByAppendingString:[arguments objectAtIndex:0]];
				
				[[UIApplication sharedApplication] openURL:[NSURL URLWithString:mapurl]];
			}
                        
                        else if ([actionName isEqualToString:@"sound"]) {
				// Split the Sound file 
				NSString *ef = (NSString *)[arguments objectAtIndex:0];
				NSArray *soundFile = [ef componentsSeparatedByString:@"."];
				
				NSString *file = (NSString *)[soundFile objectAtIndex:0];
				NSString *ext = (NSString *)[soundFile objectAtIndex:1];
				// Some TODO's here
				// Test to see if the file/ext is IN the bundle
				// Cleanup any memory that may not be caught
				sound = [[Sound alloc] initWithContentsOfFile:[mainBundle pathForResource:file ofType:ext]];
				[sound play];
			}
                        
                        // WTF?
                        else {
				NSLog(@"WARNING: Unhandled gap command \"%@\"", actionName);
			}
			
			return NO;
		}
	}
	
	if (urlHost && ![appHost isEqualToString:urlHost]) {
		if (!appHost || [urlHost rangeOfString:appHost options:NSCaseInsensitiveSearch].location == NSNotFound) {
			[[UIApplication sharedApplication] openURL:url];
			return NO;
		}
	}
	
	return YES;
}

- (void)locationManager:(CLLocationManager *)manager didUpdateToLocation:(CLLocation *)newLocation fromLocation:(CLLocation *)oldLocation
{
	[lastKnownLocation release];	
	lastKnownLocation = newLocation;
	[lastKnownLocation retain];	
	[self initializeLocation];
}

- (void)initializeLocation
{
	NSLog(@"initializeLocation();");
	[webView stringByEvaluatingJavaScriptFromString:@"initializeLocation()"];
}


- (void) accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration {
	NSString * jsCallBack = [NSString stringWithFormat:@"gotAcceleration('%f','%f','%f');", acceleration.x, acceleration.y, acceleration.z];
	[webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingImage:(UIImage *)theImage editingInfo:(NSDictionary *)editingInfo
{
    NSLog(@"photo: picked image");
	
	// Dismiss the image selection, hide the picker and show the image view with the picked image
	[picker dismissModalViewControllerAnimated:YES];
	imagePickerController.view.hidden = YES;
	
	UIDevice * dev = [UIDevice currentDevice];
	NSString *uniqueId = dev.uniqueIdentifier;
	NSData * imageData = UIImageJPEGRepresentation(theImage, 0.75);	
	NSString *urlString = [@"http://phonegap.com/demo/upload.php?" stringByAppendingString:@"uid="];
	urlString = [urlString stringByAppendingString:uniqueId];
	
	NSMutableURLRequest *request = [[[NSMutableURLRequest alloc] init] autorelease];
	[request setURL:[NSURL URLWithString:urlString]];
	[request setHTTPMethod:@"POST"];
	
	// ---------
	//Add the header info
	NSString *stringBoundary = [NSString stringWithString:@"0xKhTmLbOuNdArY"];
	NSString *contentType = [NSString stringWithFormat:@"multipart/form-data; boundary=%@",stringBoundary];
	[request addValue:contentType forHTTPHeaderField: @"Content-Type"];
	
	//create the body
	NSMutableData *postBody = [NSMutableData data];
	[postBody appendData:[[NSString stringWithFormat:@"--%@\r\n",stringBoundary] dataUsingEncoding:NSUTF8StringEncoding]];
	
	//add data field and file data
	[postBody appendData:[[NSString stringWithString:@"Content-Disposition: form-data; name=\"data\"\r\n"] dataUsingEncoding:NSUTF8StringEncoding]];
	[postBody appendData:[[NSString stringWithString:@"Content-Type: application/octet-stream\r\n\r\n"] dataUsingEncoding:NSUTF8StringEncoding]];
	[postBody appendData:[NSData dataWithData:imageData]];
	[postBody appendData:[[NSString stringWithFormat:@"\r\n--%@--\r\n",stringBoundary] dataUsingEncoding:NSUTF8StringEncoding]];

	// ---------
	[request setHTTPBody:postBody];
	
	NSURLConnection *conn=[[NSURLConnection alloc] initWithRequest:request delegate:self];
	if(conn) {
		NSLog(@"photo: connection sucess");
  } 
  else {
	  NSLog(@"photo: upload failed!");
  }

	webView.hidden = NO;
	[window bringSubviewToFront:webView];
  
  [request release];
  [conn release];
}


- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
	// Dismiss the image selection and close the program
	[picker dismissModalViewControllerAnimated:YES];
	// Hide the imagePicker and bring the web page back into focus
	imagePickerController.view.hidden = YES;
	NSLog(@"Photo Cancel Request");
	webView.hidden = NO;
	[window bringSubviewToFront:webView];
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
  NSLog(@"photo: upload finished!");
	
	#if TARGET_IPHONE_SIMULATOR
		alert(@"Did finish loading image!");
	#endif
}

-(void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *) response {
	NSLog(@"HERE RESPONSE");
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
    // append the new data to the receivedData
    // receivedData is declared as a method instance elsewhere
    // [receivedData appendData:data];
    NSLog(@"photo: progress");
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    NSLog([@"photo: upload failed! " stringByAppendingString:[error description]]);
    
#if TARGET_IPHONE_SIMULATOR
    alert(@"Error while uploading image!");
#endif    
}

- (void)dealloc {
	[appURL release];
	[imageView release];
	[viewController release];
	[window release];
	[lastKnownLocation release];
	[imagePickerController release];
	[appURL release];
  [sound release];
	[super dealloc];
}

@end
